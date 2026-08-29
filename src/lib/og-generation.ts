/**
 * OG image generation helpers and request handler.
 * Pure utility functions plus the main handleUseRequest handler
 * that uses Cloudflare native bindings (R2, Browser Rendering).
 *
 * Supports two modes via the `mode` query parameter:
 * - `mode=demo` — fetches page metadata + generates a screenshot,
 *   returns JSON for the demo UI. No D1 tracking.
 * - (default) — production OG generation with D1 site lookup,
 *   image limit checks, and 307 redirect responses.
 */

import { getDb } from "@/lib/db";
import { verifyGenerationSignature } from "@/lib/generation-signature";
import {
  extractMetadata,
  fetchPageHtml,
  resolvePublicPageUrl,
} from "@/lib/metadata";
import {
  buildPublicImageUrl,
  ensureWebsiteProtocol,
  extractUrlParts,
  isSelfReferentialUseUrl,
  validateOutboundUrl,
} from "@/lib/url";
import {
  refundUserGeneration,
  reserveDemoGeneration,
  reserveProductionGeneration,
} from "@/server/generation-usage";
import {
  acquireGenerationLock,
  findCachedImageKey,
  getSiteForUrlBase,
  recordImage,
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
 * - Demo mode always uses `demo/{cacheKey}.jpeg` regardless of prefix.
 * - Production uses `{prefix}/{cacheKey}.jpeg`.
 */
export function getR2Key(
  cacheKey: string,
  prefix?: string,
  isDemo?: boolean,
): string {
  if (isDemo) {
    return `demo/${cacheKey}.jpeg`;
  }
  return `${prefix}/${cacheKey}.jpeg`;
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
 * Create a revocable 307 redirect. R2 remains the source of truth, so site
 * deletion and refresh take effect immediately without per-colo cache purges.
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
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
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
/**
 * Render a URL with Browser Run's first-class Quick Action binding. The caller
 * resolves and validates the redirect chain before invoking this paid sink.
 */
export async function takeScreenshot(
  url: string,
): Promise<ArrayBuffer> {
  const browser = env.BROWSER as unknown as BrowserRunBinding;
  const response = await browser.quickAction("screenshot", {
    url,
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
  if (
    !validatedUrl ||
    isSelfReferentialUseUrl(validatedUrl, requestHostname)
  ) {
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
        notice: "Live screenshot capacity is currently busy. Showing an example image.",
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
 * Handle a production-mode request: look up the site in D1, check
 * image limits, generate a screenshot on cache miss, store in R2,
 * record metadata in D1, and return a 307 redirect.
 */
async function handleProductionRequest(
  request: Request,
  url: string,
  signature: string | null,
  firstParty: boolean,
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
  const configuredHostname = new URL(
    import.meta.env.VITE_SITE_URL as string,
  ).hostname;
  const isApprovedFirstParty =
    firstParty &&
    validatedUrl.search === "" &&
    (validatedUrl.hostname === requestHostname ||
      validatedUrl.hostname === configuredHostname);
  const db = getDb();
  const [cacheKey, selectedSite] = await Promise.all([
    generateCacheKey(sanitizedUrl),
    getSiteForUrlBase(db, urlBase),
  ]);

  if (!selectedSite) {
    return createJsonResponse(
      {
        error: "Website must be added to Mosaic before generating OG images",
      },
      404,
    );
  }

  if (
    !isApprovedFirstParty &&
    (!signature ||
      !(await verifyGenerationSignature(
        selectedSite.generationSecret,
        sanitizedUrl,
        signature,
      )))
  ) {
    return createJsonResponse(
      { error: "A valid signature for this exact page URL is required." },
      403,
    );
  }

  const existingKey = await findCachedImageKey(
    db,
    sanitizedUrl,
    selectedSite.siteId,
  );
  if (existingKey) {
    return createRedirectResponse(buildPublicImageUrl(existingKey));
  }

  const clientKey = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rateLimit = await env.SITE_RATE_LIMITER.limit({
    key: `${selectedSite.siteId}:${clientKey}`,
  });
  if (!rateLimit.success) {
    return createFallbackRedirectResponse(request);
  }

  const leaseToken = await acquireGenerationLock(
    db,
    selectedSite.siteId,
    sanitizedUrl,
  );
  if (!leaseToken) {
    return createJsonResponse(
      { error: "This image is already being generated. Please retry shortly." },
      503,
      { "Retry-After": "2", "Cache-Control": "no-store" },
    );
  }

  const reservation = await reserveProductionGeneration(
    db,
    selectedSite.userId,
  );
  if (!reservation.reserved) {
    await releaseGenerationLock(
      db,
      selectedSite.siteId,
      sanitizedUrl,
      leaseToken,
    );
    return createFallbackRedirectResponse(request);
  }

  const imageKey = getR2Key(cacheKey, selectedSite.r2Prefix, false);
  let committed = false;
  try {
    const finalUrl = await resolvePublicPageUrl(
      new URL(sanitizedUrl),
      requestHostname,
    );
    const imageBuffer = await takeScreenshot(finalUrl.toString());
    await env.OG_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: { contentType: "image/jpeg" },
    });

    const inserted = await recordImage(
      db,
      selectedSite.siteId,
      imageKey,
      sanitizedUrl,
      imageBuffer.byteLength,
    );
    committed = inserted;
    if (!inserted) console.info("[USE] Concurrent image already recorded");

    return createRedirectResponse(buildPublicImageUrl(imageKey));
  } catch (err) {
    console.error("[USE] Failed to generate or persist image:", err);
    return createFallbackRedirectResponse(request);
  } finally {
    if (!committed) {
      await refundUserGeneration(db, selectedSite.userId).catch((error) =>
        console.error("[USE] Failed to refund generation allowance:", error),
      );
    }
    await releaseGenerationLock(
      db,
      selectedSite.siteId,
      sanitizedUrl,
      leaseToken,
    ).catch((error) =>
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
    const signature = requestUrl.searchParams.get("sig");
    const firstParty = requestUrl.searchParams.get("self") === "1";

    if (!url) {
      return createJsonResponse({ error: "URL parameter is required" }, 400);
    }

    // Browser Run reaches a screenshot target as a document navigation. /use
    // is an image endpoint, so rejecting navigations breaks redirect-assisted
    // self-recursion while preserving social crawler image requests.
    if (
      request.headers.get("Sec-Fetch-Mode") === "navigate" ||
      request.headers.get("Sec-Fetch-Dest") === "document"
    ) {
      return createJsonResponse(
        { error: "This endpoint cannot be used as a document target." },
        400,
      );
    }

    if (mode === "demo") {
      return handleDemoRequest(request, url);
    }

    return handleProductionRequest(request, url, signature, firstParty);
  } catch (err) {
    console.error("[USE] Unhandled error:", err);
    return createJsonResponse({ error: "Internal server error" }, 500);
  }
}
