/**
 * The public `GET /use?url=<page>` endpoint.
 *
 * - Default: production generation. Only hostnames saved by a user are
 *   served. A shared image redirects (307) straight to `/i/<key>`; an expired
 *   one is regenerated after the response. A missing one is generated behind
 *   the rate limit, generation lock and daily budget, falling back to the
 *   example image. The colo's Cache API remembers fresh answers for a few
 *   minutes, so repeat crawler hits skip D1.
 * - `mode=demo`: the home page demo. Returns page metadata and an inline
 *   screenshot as JSON, without D1 image records or R2.
 */

import { recordGenerationEvent, type GenerationOutcome } from "@/lib/analytics";
import { publicCorsHeaders } from "@/lib/cors";
import { getDb, type D1Queryable } from "@/lib/db";
import { buildImageKey } from "@/lib/image-key";
import { cacheGeneratedImage } from "@/lib/image-serving";
import { extractMetadata, fetchPublicPage } from "@/lib/metadata";
import { isMosaicRendererRequest } from "@/lib/request";
import { takeScreenshot } from "@/lib/screenshot";
import {
  buildPublicImageUrl,
  canonicalPage,
  parseWebsiteUrl,
  validateOutboundUrl,
} from "@/lib/url";
import { reserveGeneration } from "@/server/generation-usage";
import {
  acquireGenerationLock,
  findGlobalImage,
  findGlobalImageOrLock,
  isHostnameAssociated,
  recordGlobalImageAndRelease,
  releaseGenerationLock,
} from "@/server/og";
import { env, waitUntil } from "cloudflare:workers";

const FALLBACK_IMAGE_PATH = "/images/mosaic-example-og-f9e253a9.png";

type Target = {
  url: URL;
  pageUrl: string;
  hostname: string;
  requestHostname: string;
  /** Origin of the request, which serves `/i/*` for this deployment. */
  requestOrigin: string;
};

// ── Responses ───────────────────────────────────────────────────────

function json(
  body: object,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...publicCorsHeaders,
      ...extraHeaders,
    },
  });
}

/**
 * Redirect to the current service-owned image. D1 controls automatic renewal,
 * so this response is not cached independently of the global image record.
 */
function redirect(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "private, no-store",
      ...publicCorsHeaders,
    },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function toJpegDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

/**
 * Start the page fetch that validates a target's redirects while slower
 * checks run. `cancel()` stops it, and its body, when they fail.
 */
function startPageFetch(target: Target, deadline?: AbortSignal) {
  const controller = new AbortController();
  const signal = deadline
    ? AbortSignal.any([controller.signal, deadline])
    : controller.signal;
  const page = fetchPublicPage(target.url, target.requestHostname, signal);
  // Callers await this only once the checks pass.
  page.catch(() => {});
  return { page, cancel: () => controller.abort() };
}

// ── Demo mode ───────────────────────────────────────────────────────

/**
 * Fetch the page once, then read its metadata and screenshot it. A per-client
 * limiter and a global daily budget protect the shared Browser Run
 * allowance before paid work begins; the page fetch runs while the budget
 * is reserved.
 */
async function handleDemoRequest(
  request: Request,
  target: Target,
): Promise<Response> {
  const noStore = { "Cache-Control": "private, no-store" };
  const client = clientKey(request);

  const rateLimit = await env.DEMO_RATE_LIMITER.limit({ key: client });
  if (!rateLimit.success) {
    return json(
      { error: "Too many demo requests. Please try again in a minute." },
      429,
      { "Retry-After": "60" },
    );
  }

  // One fetch validates the redirect chain for the screenshot and supplies
  // the HTML for the metadata.
  const { page, cancel } = startPageFetch(target);
  let reserved: boolean;
  try {
    reserved = await reserveGeneration(getDb(), "demo", client);
  } catch (error) {
    cancel();
    throw error;
  }
  if (!reserved) {
    cancel();
    return json(
      {
        normalizedUrl: target.pageUrl,
        title: "",
        description: "",
        image: "",
        imageUrl: new URL(FALLBACK_IMAGE_PATH, request.url).toString(),
        notice:
          "Live screenshot capacity is currently busy. Showing an example image.",
      },
      200,
      noStore,
    );
  }

  // The screenshot starts once the page's headers arrive.
  const [metadata, screenshot] = await Promise.allSettled([
    page.then(({ response, finalUrl }) => extractMetadata(response, finalUrl)),
    page.then(({ finalUrl }) => takeScreenshot(finalUrl.toString())),
  ]);
  const meta =
    metadata.status === "fulfilled"
      ? metadata.value
      : { title: "", description: "", image: "" };

  return json(
    {
      normalizedUrl: target.pageUrl,
      ...meta,
      imageUrl:
        screenshot.status === "fulfilled"
          ? toJpegDataUrl(screenshot.value)
          : null,
      ...(screenshot.status === "rejected"
        ? {
            error:
              screenshot.reason instanceof Error
                ? screenshot.reason.message
                : "Failed to generate OG image",
          }
        : {}),
    },
    200,
    noStore,
  );
}

// ── Production mode ─────────────────────────────────────────────────

/** Overall limit for resolving a page's redirects before a screenshot. */
const PAGE_FETCH_DEADLINE_MS = 8_000;

type GenerationResult =
  | { key: string }
  | { skipped: "rate_limited" | "locked" | "budget_exhausted" | "failed" };

/**
 * Take and store a fresh screenshot of `target`, behind the rate limit,
 * generation lock and daily budget, in that order. Records the outcome. If
 * the image is already fresh once the lock is held, returns it instead.
 * The lock's 60 s lease is the backstop if the Worker is stopped mid-run.
 *
 * D1 writes go to the primary, which can be far from this colo, so they are
 * batched: lock and re-read, then both budgets, then record and release.
 * The page fetch only validates redirects, so it runs while the budget is
 * reserved; the screenshot waits for both.
 *
 * Every screenshot gets a new R2 key (`global/<page hash>-<version>.jpeg`),
 * so an `/i/<key>` URL never changes content and can be cached for good. The
 * image it replaces is deleted; `/i/*` redirects its old URL to the new key.
 */
export async function generateImage(
  db: D1Queryable,
  target: Target,
  client: string,
): Promise<GenerationResult> {
  const { pageUrl, hostname } = target;
  const record = (
    outcome: GenerationOutcome,
    metrics?: { durationMs: number; bytes?: number },
  ) => recordGenerationEvent({ outcome, hostname, ...metrics });

  const rateLimit = await env.SITE_RATE_LIMITER.limit({ key: client });
  if (!rateLimit.success) {
    record("rate_limited");
    return { skipped: "rate_limited" };
  }

  const lock = await acquireGenerationLock(db, pageUrl);
  if (!lock) {
    record("locked");
    return { skipped: "locked" };
  }

  let released = false;
  try {
    const { current } = lock;
    if (current && current.expiresAt > Date.now()) return { key: current.key };
    const previousKey = current?.key ?? null;

    const startedAt = Date.now();
    // Resolve and validate every server redirect before Browser Run
    // navigates; only the final URL is needed.
    // Background runs get about 30 s after the response, so the page
    // fetch, redirects included, must leave room for the screenshot.
    const { page, cancel } = startPageFetch(
      target,
      AbortSignal.timeout(PAGE_FETCH_DEADLINE_MS),
    );
    let reserved: boolean;
    try {
      reserved = await reserveGeneration(db, "production", client);
    } catch (error) {
      cancel();
      throw error;
    }
    if (!reserved) {
      cancel();
      record("budget_exhausted");
      return { skipped: "budget_exhausted" };
    }

    try {
      const { response, finalUrl } = await page;
      await response.body?.cancel();
      const image = await takeScreenshot(finalUrl.toString());
      const key = buildImageKey(await sha256Hex(pageUrl), Date.now());
      const stored = await env.OG_BUCKET.put(key, image, {
        httpMetadata: { contentType: "image/jpeg" },
      });
      await recordGlobalImageAndRelease(
        db,
        target,
        key,
        image.byteLength,
        lock.leaseToken,
      );
      released = true;

      cacheGeneratedImage(imageUrl(target, key), image, stored.httpEtag);
      if (previousKey && previousKey !== key) {
        waitUntil(
          env.OG_BUCKET.delete(previousKey).catch((error) =>
            console.error("[USE] Failed to delete replaced image:", error),
          ),
        );
      }

      record("generated", {
        durationMs: Date.now() - startedAt,
        bytes: image.byteLength,
      });
      return { key };
    } catch (error) {
      console.error("[USE] Failed to generate or persist image:", error);
      record("failed", { durationMs: Date.now() - startedAt });
      return { skipped: "failed" };
    }
  } finally {
    if (!released) {
      await releaseGenerationLock(db, pageUrl, lock.leaseToken).catch((error) =>
        console.error("[USE] Failed to release generation lock:", error),
      );
    }
  }
}

/**
 * Generate the image for a website's home page unless a fresh one exists, so
 * the first social crawler after a site is added gets a cached image.
 */
export async function warmSiteImage(
  hostname: string,
  requestUrl: string,
  client: string,
): Promise<void> {
  try {
    const { hostname: requestHostname, origin: requestOrigin } = new URL(
      requestUrl,
    );
    const url = parseWebsiteUrl(hostname);
    if (validateOutboundUrl(url, requestHostname)) return;
    const page = canonicalPage(url);
    const target = {
      ...page,
      url: new URL(page.pageUrl),
      requestHostname,
      requestOrigin,
    };

    const db = getDb();
    const cachedImage = await findGlobalImage(db, target.pageUrl);
    if (cachedImage && cachedImage.expiresAt > Date.now()) return;
    await generateImage(db, target, client);
  } catch (error) {
    console.error("[USE] Failed to warm site image:", error);
  }
}

/** How long a colo answers `/use` for a fresh image without reading D1. */
const USE_CACHE_MAX_AGE_S = 300;
/** How long a colo remembers that a hostname is not registered. */
const UNREGISTERED_CACHE_MAX_AGE_S = 30;
const USE_CACHE_NAME = "mosaic:use";

/**
 * Cache API keys for `/use` answers. A fresh image is remembered per page,
 * and an unregistered hostname per hostname, so adding the site can forget
 * it (`forgetUnregisteredHostname`).
 */
function useCacheKey(
  origin: string,
  kind: "page" | "hostname",
  value: string,
): Request {
  return new Request(
    `${origin}/use-cache/${kind}?value=${encodeURIComponent(value)}`,
  );
}

function rememberUseAnswer(
  cacheKey: Request,
  body: string,
  maxAgeSeconds: number,
): void {
  if (maxAgeSeconds < 1) return;
  const response = new Response(body, {
    headers: { "Cache-Control": `public, max-age=${maxAgeSeconds}` },
  });
  waitUntil(
    caches
      .open(USE_CACHE_NAME)
      .then((cache) => cache.put(cacheKey, response))
      .catch((error: unknown) =>
        console.error("[USE] Failed to cache answer:", error),
      ),
  );
}

/**
 * Forget that `hostname` was unregistered, in this colo, once it is added.
 * Other colos forget within `UNREGISTERED_CACHE_MAX_AGE_S`.
 */
export async function forgetUnregisteredHostname(
  requestUrl: string,
  hostname: string,
): Promise<void> {
  const { origin } = new URL(requestUrl);
  const cache = await caches.open(USE_CACHE_NAME);
  await cache.delete(useCacheKey(origin, "hostname", hostname));
}

/**
 * The `/i/<key>` URL for an image, on the origin that served this request
 * rather than the build-time site URL, so Worker Previews read from their own
 * R2 bucket.
 */
function imageUrl(target: Target, key: string): string {
  return buildPublicImageUrl(key, `${target.requestOrigin}/i/`);
}

/** How long a request waits for a first image another request is taking. */
const LOCKED_WAIT_MS = 10_000;
const LOCKED_POLL_MS = 1_000;

/**
 * Wait for the request holding the page's lock to store its first image.
 * Social crawlers often fetch a new link several times at once, and most
 * don't retry, so waiting beats refusing. Stops early if the lock is
 * released without an image.
 */
async function waitForFirstImage(pageUrl: string): Promise<string | null> {
  // The primary: replicas may not have the new row yet.
  const db = getDb();
  const deadline = Date.now() + LOCKED_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, LOCKED_POLL_MS));
    const { image, locked } = await findGlobalImageOrLock(db, pageUrl);
    if (image) return image.key;
    if (!locked) return null;
  }
  return null;
}

/**
 * When this isolate started refreshing each stale page. The lock dedupes
 * across isolates; this skips its rate limit and D1 writes when a burst of
 * crawler hits lands on one isolate. An entry older than the lock's lease is
 * ignored, in case the runtime stopped the refresh before it cleaned up.
 */
const refreshing = new Map<string, number>();
const REFRESH_LEASE_MS = 60_000;

async function handleProductionRequest(
  request: Request,
  target: Target,
): Promise<Response> {
  const { pageUrl, hostname, requestOrigin } = target;
  const pageCacheKey = useCacheKey(requestOrigin, "page", pageUrl);
  const hostnameCacheKey = useCacheKey(requestOrigin, "hostname", hostname);

  const cache = await caches.open(USE_CACHE_NAME);
  const [cachedKey, cachedUnregistered] = await Promise.all([
    cache.match(pageCacheKey),
    cache.match(hostnameCacheKey),
  ]);
  if (cachedUnregistered) {
    recordGenerationEvent({ outcome: "unregistered", hostname });
    return unregistered();
  }
  if (cachedKey) {
    recordGenerationEvent({ outcome: "cache_hit", hostname });
    return redirect(imageUrl(target, await cachedKey.text()));
  }

  // A session lets these lookups hit the nearest D1 read replica. Later
  // writes go to the primary, and the session keeps them sequentially
  // consistent.
  const db = getDb().withSession("first-unconstrained");
  const [isAssociated, cachedImage] = await Promise.all([
    isHostnameAssociated(db, hostname),
    findGlobalImage(db, pageUrl),
  ]);

  if (!isAssociated) {
    recordGenerationEvent({ outcome: "unregistered", hostname });
    rememberUseAnswer(hostnameCacheKey, "", UNREGISTERED_CACHE_MAX_AGE_S);
    return unregistered();
  }

  const rememberFresh = (key: string, expiresAt: number) =>
    rememberUseAnswer(
      pageCacheKey,
      key,
      Math.min(
        USE_CACHE_MAX_AGE_S,
        Math.floor((expiresAt - Date.now()) / 1000),
      ),
    );

  if (cachedImage) {
    if (cachedImage.expiresAt > Date.now()) {
      recordGenerationEvent({ outcome: "cache_hit", hostname });
      rememberFresh(cachedImage.key, cachedImage.expiresAt);
    } else {
      // Serve the stale image now and refresh it after the response, so
      // social crawlers never wait for a screenshot they would time out on.
      recordGenerationEvent({ outcome: "stale_hit", hostname });
      const startedAt = refreshing.get(pageUrl);
      if (!startedAt || Date.now() - startedAt > REFRESH_LEASE_MS) {
        refreshing.set(pageUrl, Date.now());
        waitUntil(
          generateImage(db, target, clientKey(request)).finally(() =>
            refreshing.delete(pageUrl),
          ),
        );
      }
    }
    return redirect(imageUrl(target, cachedImage.key));
  }

  // No image yet: this request waits for the first one.
  const result = await generateImage(db, target, clientKey(request));
  if ("key" in result) return redirect(imageUrl(target, result.key));
  if (result.skipped === "locked") {
    const key = await waitForFirstImage(pageUrl);
    if (key) return redirect(imageUrl(target, key));
    return json(
      { error: "This image is already being generated. Please retry shortly." },
      503,
      { "Retry-After": "2", "Cache-Control": "no-store" },
    );
  }
  return redirect(new URL(FALLBACK_IMAGE_PATH, request.url).toString());
}

function unregistered(): Response {
  return json(
    { error: "Website must be added to Mosaic before generating OG images" },
    404,
  );
}

// ── Entry point ─────────────────────────────────────────────────────

export async function handleUseRequest(request: Request): Promise<Response> {
  try {
    const {
      searchParams,
      hostname: requestHostname,
      origin: requestOrigin,
    } = new URL(request.url);
    const rawUrl = searchParams.get("url");
    if (!rawUrl) {
      return json({ error: "URL parameter is required" }, 400);
    }

    // A captured page can redirect the browser back to /use. The renderer's
    // deny-only marker stops recursion without restricting ordinary browsers
    // and social crawlers.
    if (isMosaicRendererRequest(request)) {
      return json({ error: "Recursive screenshot request blocked." }, 400);
    }

    let url: URL;
    try {
      url = parseWebsiteUrl(rawUrl);
    } catch {
      return json({ error: "Please enter a valid website URL." }, 400);
    }
    const validationError = validateOutboundUrl(url, requestHostname);
    if (validationError) {
      return json({ error: validationError }, 400);
    }

    const page = canonicalPage(url);
    const target = {
      ...page,
      url: new URL(page.pageUrl),
      requestHostname,
      requestOrigin,
    };
    // Awaited so the catch below answers rejections too.
    return await (searchParams.get("mode") === "demo"
      ? handleDemoRequest(request, target)
      : handleProductionRequest(request, target));
  } catch (error) {
    console.error("[USE] Unhandled error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
