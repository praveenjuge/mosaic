/**
 * The public `GET /use?url=<page>` endpoint.
 *
 * - Default: production generation. Only hostnames saved by a user are
 *   served. A fresh shared image redirects (307) straight to `/i/<key>`; an
 *   expired or missing one is regenerated behind the rate limit, generation
 *   lock and daily budget, falling back to the stale or example image.
 * - `mode=demo`: the home page demo. Returns page metadata and an inline
 *   screenshot as JSON, without D1 image records or R2.
 */

import { recordGenerationEvent, type GenerationOutcome } from "@/lib/analytics";
import { publicCorsHeaders } from "@/lib/cors";
import { getDb } from "@/lib/db";
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
  isHostnameAssociated,
  recordGlobalImage,
  releaseGenerationLock,
} from "@/server/og";
import { env } from "cloudflare:workers";

const FALLBACK_IMAGE_PATH = "/images/mosaic-example-og-f9e253a9.png";

type Target = {
  url: URL;
  pageUrl: string;
  hostname: string;
  requestHostname: string;
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

// ── Demo mode ───────────────────────────────────────────────────────

/**
 * Fetch the page once, then read its metadata and screenshot it. A per-client
 * limiter and a global daily budget protect the shared Browser Run
 * allowance before paid work begins.
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

  if (!(await reserveGeneration(getDb(), "demo", client))) {
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

  // One fetch validates the redirect chain for the screenshot and supplies
  // the HTML for the metadata. The screenshot starts once headers arrive.
  const page = fetchPublicPage(target.url, target.requestHostname);
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

async function handleProductionRequest(
  request: Request,
  target: Target,
): Promise<Response> {
  const { pageUrl, hostname } = target;
  // Redirect to images on the origin that served this request, not the
  // build-time site URL, so Worker Previews read from their own R2 bucket.
  const imageUrl = (key: string) =>
    buildPublicImageUrl(key, new URL("/i/", request.url).toString());

  // A session lets these lookups hit the nearest D1 read replica. Later
  // writes go to the primary, and the session keeps them sequentially
  // consistent.
  const db = getDb().withSession("first-unconstrained");
  const [isAssociated, cachedImage] = await Promise.all([
    isHostnameAssociated(db, hostname),
    findGlobalImage(db, pageUrl),
  ]);
  const record = (
    outcome: GenerationOutcome,
    metrics?: { durationMs: number; bytes?: number },
  ) => recordGenerationEvent({ outcome, hostname, ...metrics });

  /** Serve the stale image, or the example image when there is none. */
  const fallback = () =>
    redirect(
      cachedImage
        ? imageUrl(cachedImage.key)
        : new URL(FALLBACK_IMAGE_PATH, request.url).toString(),
    );

  if (!isAssociated) {
    record("unregistered");
    return json(
      { error: "Website must be added to Mosaic before generating OG images" },
      404,
    );
  }

  if (cachedImage && cachedImage.expiresAt > Date.now()) {
    record("cache_hit");
    return redirect(imageUrl(cachedImage.key));
  }

  const client = clientKey(request);
  const rateLimit = await env.SITE_RATE_LIMITER.limit({ key: client });
  if (!rateLimit.success) {
    record("rate_limited");
    return fallback();
  }

  const leaseToken = await acquireGenerationLock(db, pageUrl);
  if (!leaseToken) {
    record("locked");
    return cachedImage
      ? fallback()
      : json(
          {
            error:
              "This image is already being generated. Please retry shortly.",
          },
          503,
          { "Retry-After": "2", "Cache-Control": "no-store" },
        );
  }

  try {
    if (!(await reserveGeneration(db, "production", client))) {
      record("budget_exhausted");
      return fallback();
    }

    const startedAt = Date.now();
    try {
      // Resolve and validate every server redirect before Browser Run
      // navigates; only the final URL is needed.
      const { response, finalUrl } = await fetchPublicPage(
        target.url,
        target.requestHostname,
      );
      await response.body?.cancel();
      const image = await takeScreenshot(finalUrl.toString());
      const imageKey = `global/${await sha256Hex(pageUrl)}.jpeg`;
      await env.OG_BUCKET.put(imageKey, image, {
        httpMetadata: { contentType: "image/jpeg" },
      });
      await recordGlobalImage(db, target, imageKey, image.byteLength);

      record("generated", {
        durationMs: Date.now() - startedAt,
        bytes: image.byteLength,
      });
      return redirect(imageUrl(imageKey));
    } catch (error) {
      console.error("[USE] Failed to generate or persist image:", error);
      record("failed", { durationMs: Date.now() - startedAt });
      return fallback();
    }
  } finally {
    await releaseGenerationLock(db, pageUrl, leaseToken).catch((error) =>
      console.error("[USE] Failed to release generation lock:", error),
    );
  }
}

// ── Entry point ─────────────────────────────────────────────────────

export async function handleUseRequest(request: Request): Promise<Response> {
  try {
    const { searchParams, hostname: requestHostname } = new URL(request.url);
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
    const target = { ...page, url: new URL(page.pageUrl), requestHostname };
    return searchParams.get("mode") === "demo"
      ? handleDemoRequest(request, target)
      : handleProductionRequest(request, target);
  } catch (error) {
    console.error("[USE] Unhandled error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
