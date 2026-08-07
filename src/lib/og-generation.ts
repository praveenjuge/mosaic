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
import { extractMetadata, fetchPageHtml } from "@/lib/metadata";
import {
  buildPublicImageUrl,
  ensureWebsiteProtocol,
  extractUrlParts,
} from "@/lib/url";
import {
  findCachedImageKey,
  getSitesForUrlBase,
  recordImage,
} from "@/server/og";
import { env, waitUntil } from "cloudflare:workers";

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

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

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
export function validateUrl(
  url: string,
  isProduction: boolean,
): UrlValidationResult {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return { isValid: false, error: "Invalid URL provided" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { isValid: false, error: "Invalid URL provided" };
  }

  if (isProduction && LOCALHOST_HOSTNAMES.has(parsedUrl.hostname)) {
    return { isValid: false, error: "Local URLs are not allowed" };
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
 * Create a 307 redirect response with CORS headers and long-lived cache control.
 */
export function createRedirectResponse(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "public, max-age=31536000, immutable",
      ...corsHeaders,
    },
  });
}

// ── Screenshot Helper ───────────────────────────────────────────────

/**
 * Take a JPEG screenshot of the given URL via the Cloudflare Browser Run
 * `screenshot` Quick Action on the `BROWSER` Workers binding.
 *
 * Uses [Kitesurf](https://developers.cloudflare.com/browser-run/kitesurf/)
 * as the default engine — Cloudflare's Workers-native browser that uses
 * less CPU and memory than Chromium (free while in beta). Opt-in is the
 * documented `?browser=kitesurf` query param on the binding fetch URL
 * (same pattern as CDP / REST and `@cloudflare/puppeteer`), not a body
 * field. No account ID or API token required.
 *
 * Uses `networkidle2` (≤ 2 open connections for 500 ms) instead of
 * `networkidle0` to avoid stalling on sites with persistent connections
 * (analytics beacons, websockets, long-polling).
 */
export async function takeScreenshot(url: string): Promise<ArrayBuffer> {
  // `BROWSER` is typed as a plain `Fetcher` by the bundled runtime types;
  // cast to the Browser Run surface until those types include `BrowserRun`.
  const browser = env.BROWSER as unknown as BrowserRunBinding;
  // Binding fetch uses the same fake-host convention as @cloudflare/puppeteer.
  // Kitesurf is selected via query string per Cloudflare's Kitesurf docs.
  const response = await browser.fetch(
    "https://fake.host/screenshot?browser=kitesurf",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        viewport: { width: 1560, height: 819 },
        gotoOptions: { waitUntil: "networkidle2", timeout: 15000 },
        addStyleTag: [{ content: "* { overflow: hidden; }" }],
        screenshotOptions: { type: "jpeg", quality: 85 },
      } satisfies BrowserRunScreenshotInput),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Browser Rendering quick action returned ${response.status}: ${text}`,
    );
  }

  return response.arrayBuffer();
}

// ── Demo Mode Handler ───────────────────────────────────────────────

/** Cache-Control for demo JSON responses (1 hour). */
const DEMO_CACHE_CONTROL = "public, max-age=3600";

/**
 * Handle a demo-mode request: fetch page metadata and generate a
 * screenshot in parallel, returning a JSON response with both.
 *
 * Demo images are stored under the `demo/` R2 prefix and are not
 * tracked in D1.
 */
async function handleDemoRequest(url: string): Promise<Response> {
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
  const { isValid, error } = validateUrl(normalizedUrl, true);
  if (!isValid) {
    return createJsonResponse({ error }, 400);
  }

  // Parse URL for metadata fetching
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return createJsonResponse({ error: "Invalid URL provided" }, 400);
  }

  const { sanitizedUrl } = extractUrlParts(normalizedUrl);

  // Fetch metadata and generate screenshot in parallel
  const [metadata, screenshotResult] = await Promise.allSettled([
    fetchPageHtml(parsedUrl).then((html) => extractMetadata(html, parsedUrl)),
    (async () => {
      const cacheKey = await generateCacheKey(normalizedUrl);
      const imageKey = getR2Key(cacheKey, undefined, true);

      // Check R2 cache first
      const cached = await env.OG_BUCKET.head(imageKey);
      if (cached) {
        return {
          imageUrl: buildPublicImageUrl(imageKey),
          cached: true,
        };
      }

      // Take screenshot
      const imageBuffer = await takeScreenshot(normalizedUrl);

      // Store in R2
      try {
        await env.OG_BUCKET.put(imageKey, imageBuffer, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        return {
          imageUrl: buildPublicImageUrl(imageKey),
          cached: false,
        };
      } catch {
        // R2 put failure — return base64 fallback
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(imageBuffer)),
        );
        return {
          imageUrl: `data:image/jpeg;base64,${base64}`,
          cached: false,
        };
      }
    })(),
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
    imageUrl = screenshotResult.value.imageUrl;
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
): Promise<Response> {
  // Validate URL (always production in Workers)
  const { isValid, error } = validateUrl(url, true);
  if (!isValid) {
    return createJsonResponse({ error }, 400);
  }

  // Edge cache check
  const cache = (caches as unknown as { default: Cache })["default"];
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Run cache key generation and D1 site lookup in parallel.
  // Use a read session for the lookup — it can hit the nearest replica.
  const { urlBase } = extractUrlParts(url);
  const readSession = getDb().withSession();
  const [cacheKey, sitesResult] = await Promise.all([
    generateCacheKey(url),
    getSitesForUrlBase(readSession, urlBase),
  ]);

  if (sitesResult.sites.length === 0) {
    return createJsonResponse(
      {
        error: "Website must be added to Mosaic before generating OG images",
      },
      404,
    );
  }

  // Check D1 for an existing image record instead of looping R2 HEAD calls
  const siteIds = sitesResult.sites.map((s) => s.siteId);
  const existingKey = await findCachedImageKey(readSession, url, siteIds);
  if (existingKey) {
    const response = createRedirectResponse(buildPublicImageUrl(existingKey));
    waitUntil(cache.put(request, response.clone()));
    return response;
  }

  // Check image limit
  const selectedSite = sitesResult.selectedSite;
  if (!selectedSite) {
    return createJsonResponse(
      {
        error: "OG image limit exceeded. Please contact support.",
      },
      403,
    );
  }

  const imageKey = getR2Key(cacheKey, selectedSite.r2Prefix, false);

  // Take screenshot (cache miss)
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await takeScreenshot(url);
  } catch (err) {
    console.error("[USE] Screenshot failed:", err);
    return createJsonResponse({ error: "Failed to take screenshot" }, 500);
  }

  // Store in R2
  try {
    await env.OG_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: { contentType: "image/jpeg" },
    });

    // Best-effort D1 record via waitUntil — don't block the response
    waitUntil(
      recordImage(
        getDb(),
        selectedSite.siteId,
        imageKey,
        url,
        imageBuffer.byteLength,
      ).catch((err) => console.error("[USE] recordImage failed:", err)),
    );

    const response = createRedirectResponse(buildPublicImageUrl(imageKey));
    waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (err) {
    // R2 put failure — return base64 fallback
    console.error("[USE] R2 put failed, returning base64 fallback:", err);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    return createJsonResponse(
      {
        imageUrl: `data:image/jpeg;base64,${base64}`,
        cached: false,
        fallback: true,
      },
      200,
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

    if (mode === "demo") {
      return handleDemoRequest(url);
    }

    return handleProductionRequest(request, url);
  } catch (err) {
    console.error("[USE] Unhandled error:", err);
    return createJsonResponse({ error: "Internal server error" }, 500);
  }
}
