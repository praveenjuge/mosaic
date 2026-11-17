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
 *
 * `src/server.ts` adds the CORS and security headers.
 */

import { recordGenerationEvent } from "@/server/analytics";
import { getDb, type D1Queryable } from "@/server/db";
import {
  fetchPageWithinBudget,
  generateImage,
  resolveTarget,
  targetImageUrl,
  type Target,
} from "@/server/generation";
import { requestClientKey } from "@/server/generation-usage";
import {
  findGlobalImage,
  findGlobalImageOrLock,
  GENERATION_LOCK_LEASE_MS,
  isHostnameAssociated,
} from "@/server/image-store";
import { extractMetadata } from "@/server/metadata";
import { isMosaicRendererRequest, takeScreenshot } from "@/server/screenshot";
import {
  recallUseAnswer,
  rememberFreshImage,
  rememberUnregistered,
} from "@/server/use-cache";
import { env, waitUntil } from "cloudflare:workers";

const FALLBACK_IMAGE_PATH = "/images/mosaic-example-og-f9e253a9.png";
const NO_STORE = "private, no-store";

function json(
  body: object,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

/**
 * Redirect to the current service-owned image. D1 controls automatic renewal,
 * so this response is not cached independently of the global image record.
 */
function redirect(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: location, "Cache-Control": NO_STORE },
  });
}

function fallbackImageUrl(request: Request): string {
  return new URL(FALLBACK_IMAGE_PATH, request.url).toString();
}

function toJpegDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

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
  const noStore = { "Cache-Control": NO_STORE };
  const client = requestClientKey(request);

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
  const fetched = await fetchPageWithinBudget(getDb(), "demo", client, target);
  if (!fetched) {
    return json(
      {
        normalizedUrl: target.pageUrl,
        title: "",
        description: "",
        image: "",
        imageUrl: fallbackImageUrl(request),
        notice:
          "Live screenshot capacity is currently busy. Showing an example image.",
      },
      200,
      noStore,
    );
  }

  const { page } = fetched;
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

function refreshAfterResponse(
  db: D1Queryable,
  target: Target,
  client: string,
): void {
  const startedAt = refreshing.get(target.pageUrl);
  if (startedAt && Date.now() - startedAt <= GENERATION_LOCK_LEASE_MS) return;
  refreshing.set(target.pageUrl, Date.now());
  waitUntil(
    generateImage(db, target, client).finally(() =>
      refreshing.delete(target.pageUrl),
    ),
  );
}

function unregistered(): Response {
  return json(
    { error: "Website must be added to Mosaic before generating OG images" },
    404,
  );
}

async function handleProductionRequest(
  request: Request,
  target: Target,
): Promise<Response> {
  const { pageUrl, hostname, requestOrigin } = target;
  const record = (outcome: "cache_hit" | "stale_hit" | "unregistered") =>
    recordGenerationEvent({ outcome, hostname, pageUrl });

  const remembered = await recallUseAnswer(requestOrigin, target);
  if (remembered?.kind === "unregistered") {
    record("unregistered");
    return unregistered();
  }
  if (remembered?.kind === "fresh") {
    record("cache_hit");
    return redirect(targetImageUrl(target, remembered.key));
  }

  // A session lets these lookups hit the nearest D1 read replica. Later
  // writes go to the primary, and the session keeps them sequentially
  // consistent.
  const db = getDb().withSession("first-unconstrained");
  const [isAssociated, image] = await Promise.all([
    isHostnameAssociated(db, hostname),
    findGlobalImage(db, pageUrl),
  ]);

  if (!isAssociated) {
    record("unregistered");
    rememberUnregistered(requestOrigin, hostname);
    return unregistered();
  }

  if (image) {
    if (image.expiresAt > Date.now()) {
      record("cache_hit");
      rememberFreshImage(requestOrigin, pageUrl, image);
    } else {
      // Serve the stale image now and refresh it after the response, so
      // social crawlers never wait for a screenshot they would time out on.
      record("stale_hit");
      refreshAfterResponse(db, target, requestClientKey(request));
    }
    return redirect(targetImageUrl(target, image.key));
  }

  // No image yet: this request waits for the first one.
  const result = await generateImage(db, target, requestClientKey(request));
  if (result.status === "ready") {
    return redirect(targetImageUrl(target, result.key));
  }
  if (result.status === "locked") {
    const key = await waitForFirstImage(pageUrl);
    if (key) return redirect(targetImageUrl(target, key));
    return json(
      { error: "This image is already being generated. Please retry shortly." },
      503,
      { "Retry-After": "2", "Cache-Control": "no-store" },
    );
  }
  return redirect(fallbackImageUrl(request));
}

export async function handleUseRequest(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
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

    const target = resolveTarget(rawUrl, request.url);
    if ("error" in target) return json({ error: target.error }, 400);

    // Awaited so the catch below answers rejections too.
    return await (searchParams.get("mode") === "demo"
      ? handleDemoRequest(request, target)
      : handleProductionRequest(request, target));
  } catch (error) {
    console.error("[USE] Unhandled error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
