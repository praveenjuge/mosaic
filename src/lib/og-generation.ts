/**
 * OG image generation helpers and request handler.
 * Pure utility functions plus the main handleUseRequest handler
 * that uses Cloudflare native bindings (R2, Browser Rendering).
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { env } from "cloudflare:workers";
import { extractUrlParts } from "@/lib/url";

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
 * - Demo mode always uses `demo/{cacheKey}.png` regardless of prefix.
 * - Production uses `{prefix}/{cacheKey}.png`.
 */
export function getR2Key(
  cacheKey: string,
  prefix?: string,
  isDemo?: boolean,
): string {
  if (isDemo) {
    return `demo/${cacheKey}.png`;
  }
  return `${prefix}/${cacheKey}.png`;
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

/**
 * Build the public-facing URL for a cached OG image.
 */
export function buildPublicImageUrl(key: string): string {
  return `https://og.mosaicimg.com/${key}`;
}

// ── Response Helpers ────────────────────────────────────────────────

/**
 * Create a JSON response with CORS headers.
 */
export function createJsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
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

// ── Convex Client ───────────────────────────────────────────────────

let convexClient: ConvexHttpClient | null = null;

/**
 * Return a cached ConvexHttpClient instance.
 * Lazily creates the client on first call using VITE_CONVEX_URL.
 */
export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.VITE_CONVEX_URL;
    if (!url) {
      throw new Error("VITE_CONVEX_URL is not set");
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

export { api };

// ── Screenshot Helper ───────────────────────────────────────────────

/**
 * Cloudflare Browser Rendering REST API endpoint for screenshots.
 */
const BROWSER_RENDERING_URL = (accountId: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;

/**
 * Take a PNG screenshot of the given URL via the Cloudflare Browser Rendering
 * REST API `/screenshot` endpoint. This replaces the previous Puppeteer-based
 * approach and removes the need for the `@cloudflare/puppeteer` package and
 * the Workers `browser` binding.
 */
export async function takeScreenshot(url: string): Promise<ArrayBuffer> {
  const accountId = env.CF_ACCOUNT_ID;
  const apiToken = env.CF_BROWSER_RENDERING_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "CF_ACCOUNT_ID and CF_BROWSER_RENDERING_TOKEN must be set",
    );
  }

  const response = await fetch(BROWSER_RENDERING_URL(accountId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      viewport: { width: 1560, height: 819 },
      gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
      addStyleTag: [{ content: "* { overflow: hidden; }" }],
      screenshotOptions: { type: "png" },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Browser Rendering API returned ${response.status}: ${text}`,
    );
  }

  return response.arrayBuffer();
}

// ── Main Request Handler ────────────────────────────────────────────

/**
 * Handle an incoming GET /use request.
 *
 * Orchestrates the full OG image flow: URL validation, R2 cache lookup,
 * Browser Rendering screenshot, R2 storage, and Convex metadata updates.
 */
export async function handleUseRequest(
  request: Request,
): Promise<Response> {
  try {
    // 1. Parse query parameters
    const requestUrl = new URL(request.url);
    const url = requestUrl.searchParams.get("url");
    const demo = requestUrl.searchParams.get("demo");

    // 2. Require url parameter
    if (!url) {
      return createJsonResponse(
        { error: "URL parameter is required" },
        400,
      );
    }

    // 3. Validate URL (always production in Workers)
    const { isValid, error } = validateUrl(url, true);
    if (!isValid) {
      return createJsonResponse({ error }, 400);
    }

    // 4. Compute cache key
    const cacheKey = await generateCacheKey(url);

    // Variables shared across demo/production paths and the storage step
    let imageKey: string;
    let selectedSite: {
      siteId: string;
      url_base: string;
      r2Prefix: string;
    } | null = null;

    if (demo === "true") {
      // 5. Demo mode
      imageKey = getR2Key(cacheKey, undefined, true);

      const cached = await env.OG_BUCKET.head(imageKey);
      if (cached) {
        return createJsonResponse(
          {
            imageUrl: buildPublicImageUrl(imageKey),
            cached: true,
            fallback: false,
          },
          200,
        );
      }
    } else {
      // 6. Production mode
      const { urlBase } = extractUrlParts(url);

      const sitesResult = await getConvexClient().query(
        api.ogImages.getSitesForUrlBase,
        { urlBase },
      );

      if (sitesResult.sites.length === 0) {
        return createJsonResponse(
          {
            error:
              "Website must be added to Mosaic before generating OG images",
          },
          404,
        );
      }

      // Check R2 cache for each site prefix
      for (const site of sitesResult.sites) {
        const siteKey = getR2Key(cacheKey, site.r2Prefix, false);
        const cached = await env.OG_BUCKET.head(siteKey);
        if (cached) {
          return createRedirectResponse(buildPublicImageUrl(siteKey));
        }
      }

      // Check billing limit
      selectedSite = sitesResult.selectedSite;
      if (!selectedSite) {
        return createJsonResponse(
          {
            error:
              "OG image limit exceeded for this plan. Please upgrade your subscription.",
          },
          403,
        );
      }

      imageKey = getR2Key(cacheKey, selectedSite.r2Prefix, false);
    }

    // 7. Take screenshot (cache miss for both modes)
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await takeScreenshot(url);
    } catch (err) {
      console.error("[USE] Screenshot failed:", err);
      return createJsonResponse(
        { error: "Failed to take screenshot" },
        500,
      );
    }

    // 8. Store in R2
    try {
      await env.OG_BUCKET.put(imageKey, imageBuffer, {
        httpMetadata: { contentType: "image/png" },
      });

      if (demo !== "true" && selectedSite) {
        // Best-effort Convex mutation — don't fail the response
        try {
          await getConvexClient().mutation(
            api.ogImages.storeImageForSite,
            {
              siteId: selectedSite.siteId as never,
              pageUrl: url,
              imageSize: imageBuffer.byteLength,
              imageKey,
              isNew: true,
            },
          );
        } catch (err) {
          console.error("[USE] Convex storeImageForSite failed:", err);
        }

        return createRedirectResponse(buildPublicImageUrl(imageKey));
      }

      // Demo mode success
      return createJsonResponse(
        {
          imageUrl: buildPublicImageUrl(imageKey),
          cached: false,
          fallback: false,
        },
        200,
      );
    } catch (err) {
      // R2 put failure — return base64 fallback
      console.error("[USE] R2 put failed, returning base64 fallback:", err);
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(imageBuffer)),
      );
      return createJsonResponse(
        {
          imageUrl: `data:image/png;base64,${base64}`,
          cached: false,
          fallback: true,
        },
        200,
      );
    }
  } catch (err) {
    // 9. Unexpected error
    console.error("[USE] Unhandled error:", err);
    return createJsonResponse({ error: "Internal server error" }, 500);
  }
}
