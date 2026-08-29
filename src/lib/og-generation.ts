/**
 * OG image generation helpers and request handler.
 * Pure utility functions plus the main handleUseRequest handler
 * that uses Cloudflare native bindings (R2, Browser Rendering).
 *
 * Supports two modes via the `mode` query parameter:
 * - `mode=demo` — fetches page metadata + generates a screenshot,
 *   returns JSON for the demo UI. No D1 tracking.
 * - (default) — production OG generation with D1 site lookup,
 *   shared-cache controls and 307 redirect responses.
 */

import { getDb } from "@/lib/db";
import {
  extractMetadata,
  fetchPageHtml,
  resolvePublicPageUrl,
} from "@/lib/metadata";
import {
  isMosaicRendererRequest,
  MOSAIC_RENDERER_USER_AGENT,
} from "@/lib/request";
import {
  buildPublicImageUrl,
  ensureWebsiteProtocol,
  extractUrlParts,
  isSelfReferentialUseUrl,
  validateOutboundUrl,
} from "@/lib/url";
import {
  reserveDemoGeneration,
  reserveProductionGeneration,
} from "@/server/generation-usage";
import {
  acquireGenerationLock,
  findGlobalImage,
  isHostnameAssociated,
  recordGlobalImage,
  releaseGenerationLock,
} from "@/server/og";
import { env } from "cloudflare:workers";

// ── CORS Headers ────────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Cache Key Generation ────────────────────────────────────────────

/**
 * Compute the SHA-256 hex digest of a URL string using the Web Crypto API.
 */
export async function generateCacheKey(url: string): Promise<string> {
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// ── R2 Key Construction ─────────────────────────────────────────────

/**
 * Build the R2 object key for a cached OG image.
 *
 * Production images use a service-owned global namespace.
 */
export function getR2Key(cacheKey: string): string {
  return `global/${cacheKey}.jpeg`;
}

// ── URL Validation ──────────────────────────────────────────────────

interface UrlValidationResult {
  isValid: boolean;
  validatedUrl?: URL;
  error?: string;
}

/**
 * Validate a URL string for OG image generation.
 *
 * - Rejects malformed URLs and non-HTTP(S) protocols.
 * - Blocks localhost/127.0.0.1/0.0.0.0 in production.
 */
export function validateUrl(url: string): UrlValidationResult {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return { isValid: false, error: "Invalid URL provided" };
  }

  const validationError = validateOutboundUrl(parsedUrl);
  if (validationError) {
    return { isValid: false, error: validationError };
  }

  return { isValid: true, validatedUrl: parsedUrl };
}

// ── Public Image URL ────────────────────────────────────────────────

// buildPublicImageUrl is imported from @/lib/platform at the top of this file.

// ── Response Helpers ────────────────────────────────────────────────

/**
 * Create a JSON response with CORS headers.
 */
export function createJsonResponse(
  body: object,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

/**
 * Redirect to the current service-owned image. D1 controls automatic renewal,
 * so this response is not cached independently of the global image record.
 */
export function createRedirectResponse(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "private, no-store",
      ...corsHeaders,
    },
  });
}

function createFallbackRedirectResponse(request: Request): Response {
  return createRedirectResponse(
    new URL("/images/mosaic-example-og-f9e253a9.png", request.url).toString(),
  );
}

function arrayBufferToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

// ── Screenshot Helper ───────────────────────────────────────────────

/**
 * Take a JPEG screenshot of the given URL via the Cloudflare Browser Run
 * `screenshot` Quick Action, called directly through the `BROWSER` Workers
 * binding (`env.BROWSER.quickAction`).
 *
 * Uses Browser Run's default Chromium engine. Kitesurf is available on REST
 * and CDP via `?browser=kitesurf`, but the Workers Quick Action binding does
 * not yet accept an engine selector — passing `browser: "kitesurf"` in the
 * options body is rejected at runtime and breaks OG generation.
 *
 * Using the binding talks to Browser Run directly over Cloudflare's network —
 * no account ID or API token required. Requires a compatibility date of
 * `2026-03-24` or later and a `browser` binding in `wrangler.jsonc`.
 *
 * Uses `networkidle2` (≤ 2 open connections for 500 ms) instead of
 * `networkidle0` to avoid stalling on sites with persistent connections
 * (analytics beacons, websockets, long-polling).
 */
export async function takeScreenshot(url: string): Promise<ArrayBuffer> {
  const browser = env.BROWSER as unknown as BrowserRunBinding;
  const response = await browser.quickAction("screenshot", {
    url,
    userAgent: MOSAIC_RENDERER_USER_AGENT,
    viewport: { width: 1560, height: 819 },
    gotoOptions: { waitUntil: "networkidle2", timeout: 15_000 },
    addStyleTag: [{ content: "* { overflow: hidden; }" }],
    screenshotOptions: { type: "jpeg", quality: 85 },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Browser Run returned ${response.status}: ${message}`);
  }
  return response.arrayBuffer();
}

// ── Demo Mode Handler ───────────────────────────────────────────────

const DEMO_CACHE_CONTROL = "private, no-store";

/**
 * Handle a demo-mode request: fetch page metadata and generate a
 * screenshot in parallel, returning a JSON response with both.
 *
 * Demo screenshots are returned inline instead of being persisted in R2.
 * A fast per-client limiter and a durable global daily budget protect the
 * shared Browser Run allowance before paid work begins.
 */
async function handleDemoRequest(
  request: Request,
  url: string,
): Promise<Response> {
  // Normalize URL — demo accepts bare hostnames like "example.com"
  let normalizedUrl: string;
  try {
    normalizedUrl = ensureWebsiteProtocol(url);
  } catch {
    return createJsonResponse(
      { error: "Please enter a valid website URL." },
      400,
    );
  }

  // Validate
  const { isValid, error, validatedUrl } = validateUrl(normalizedUrl);
  if (!isValid) {
    return createJsonResponse({ error }, 400);
  }

  const requestHostname = new URL(request.url).hostname;
  if (!validatedUrl || isSelfReferentialUseUrl(validatedUrl, requestHostname)) {
    return createJsonResponse(
      { error: "URL may not target this service's /use endpoint." },
      400,
    );
  }

  const { sanitizedUrl } = extractUrlParts(validatedUrl.toString());
  const parsedUrl = new URL(sanitizedUrl);
  const clientKey = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rateLimit = await env.DEMO_RATE_LIMITER.limit({ key: clientKey });
  if (!rateLimit.success) {
    return createJsonResponse(
      { error: "Too many demo requests. Please try again in a minute." },
      429,
      { "Retry-After": "60" },
    );
  }

  const db = getDb();
  const reserved = await reserveDemoGeneration(db, clientKey);
  if (!reserved) {
    return createJsonResponse(
      {
        normalizedUrl: sanitizedUrl,
        title: "",
        description: "",
        image: "",
        imageUrl: new URL(
          "/images/mosaic-example-og-f9e253a9.png",
          request.url,
        ).toString(),
        notice:
          "Live screenshot capacity is currently busy. Showing an example image.",
      },
      200,
      { "Cache-Control": DEMO_CACHE_CONTROL },
    );
  }

  // Fetch metadata and generate screenshot in parallel
  const [metadata, screenshotResult] = await Promise.allSettled([
    fetchPageHtml(parsedUrl, requestHostname).then((html) =>
      extractMetadata(html, parsedUrl),
    ),
    resolvePublicPageUrl(parsedUrl, requestHostname).then((finalUrl) =>
      takeScreenshot(finalUrl.toString()),
    ),
  ]);

  // Extract metadata result
  const meta =
    metadata.status === "fulfilled"
      ? metadata.value
      : { title: "", description: "", image: "" };

  // Extract screenshot result
  let imageUrl: string | null = null;
  let screenshotError: string | undefined;

  if (screenshotResult.status === "fulfilled") {
    imageUrl = arrayBufferToDataUrl(screenshotResult.value);
  } else {
    screenshotError =
      screenshotResult.reason instanceof Error
        ? screenshotResult.reason.message
        : "Failed to generate OG image";
  }

  return createJsonResponse(
    {
      normalizedUrl: sanitizedUrl,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      imageUrl,
      ...(screenshotError ? { error: screenshotError } : {}),
    },
    200,
    { "Cache-Control": DEMO_CACHE_CONTROL },
  );
}

// ── Production Mode Handler ─────────────────────────────────────────

/**
 * Handle unsigned production generation against the shared canonical cache.
 */
async function handleProductionRequest(
  request: Request,
  url: string,
): Promise<Response> {
  // Validate URL (always production in Workers)
  const { isValid, error, validatedUrl } = validateUrl(url);
  if (!isValid || !validatedUrl) {
    return createJsonResponse({ error }, 400);
  }

  const requestHostname = new URL(request.url).hostname;
  if (isSelfReferentialUseUrl(validatedUrl, requestHostname)) {
    return createJsonResponse(
      { error: "URL may not target this service's /use endpoint." },
      400,
    );
  }

  const { urlBase, sanitizedUrl } = extractUrlParts(validatedUrl.toString());
  const db = getDb();
  const [cacheKey, isAssociated, cachedImage] = await Promise.all([
    generateCacheKey(sanitizedUrl),
    isHostnameAssociated(db, urlBase),
    findGlobalImage(db, sanitizedUrl),
  ]);

  if (!isAssociated) {
    return createJsonResponse(
      {
        error: "Website must be added to Mosaic before generating OG images",
      },
      404,
    );
  }

  if (cachedImage && cachedImage.expiresAt > Date.now()) {
    return createRedirectResponse(buildPublicImageUrl(cachedImage.key));
  }

  const clientKey = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rateLimit = await env.SITE_RATE_LIMITER.limit({ key: clientKey });
  if (!rateLimit.success) {
    return cachedImage
      ? createRedirectResponse(buildPublicImageUrl(cachedImage.key))
      : createFallbackRedirectResponse(request);
  }

  const leaseToken = await acquireGenerationLock(db, sanitizedUrl);
  if (!leaseToken) {
    if (cachedImage) {
      return createRedirectResponse(buildPublicImageUrl(cachedImage.key));
    }
    return createJsonResponse(
      { error: "This image is already being generated. Please retry shortly." },
      503,
      { "Retry-After": "2", "Cache-Control": "no-store" },
    );
  }

  const reserved = await reserveProductionGeneration(db, clientKey);
  if (!reserved) {
    await releaseGenerationLock(db, sanitizedUrl, leaseToken);
    return cachedImage
      ? createRedirectResponse(buildPublicImageUrl(cachedImage.key))
      : createFallbackRedirectResponse(request);
  }

  const imageKey = getR2Key(cacheKey);
  try {
    const finalUrl = await resolvePublicPageUrl(
      new URL(sanitizedUrl),
      requestHostname,
    );
    const imageBuffer = await takeScreenshot(finalUrl.toString());
    await env.OG_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: { contentType: "image/jpeg" },
    });

    await recordGlobalImage(db, imageKey, sanitizedUrl, imageBuffer.byteLength);

    return createRedirectResponse(buildPublicImageUrl(imageKey));
  } catch (err) {
    console.error("[USE] Failed to generate or persist image:", err);
    return cachedImage
      ? createRedirectResponse(buildPublicImageUrl(cachedImage.key))
      : createFallbackRedirectResponse(request);
  } finally {
    await releaseGenerationLock(db, sanitizedUrl, leaseToken).catch((error) =>
      console.error("[USE] Failed to release generation lock:", error),
    );
  }
}

// ── Main Request Handler ────────────────────────────────────────────

/**
 * Handle an incoming GET /use request.
 *
 * Routes to demo or production mode based on the `mode` query parameter:
 * - `mode=demo` → {@link handleDemoRequest}
 * - (default)   → {@link handleProductionRequest}
 */
export async function handleUseRequest(request: Request): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const url = requestUrl.searchParams.get("url");
    const mode = requestUrl.searchParams.get("mode");

    if (!url) {
      return createJsonResponse({ error: "URL parameter is required" }, 400);
    }

    // A captured page can redirect Chromium back to /use. The renderer's
    // deny-only marker stops recursion without relying on optional Fetch
    // Metadata or restricting ordinary browsers and social crawlers.
    if (isMosaicRendererRequest(request)) {
      return createJsonResponse(
        { error: "Recursive screenshot request blocked." },
        400,
      );
    }

    if (mode === "demo") {
      return handleDemoRequest(request, url);
    }

    return handleProductionRequest(request, url);
  } catch (err) {
    console.error("[USE] Unhandled error:", err);
    return createJsonResponse({ error: "Internal server error" }, 500);
  }
}
