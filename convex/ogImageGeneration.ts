"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import crypto from "crypto";

// Constants
const PUBLIC_R2_BASE_URL = "https://og.mosaicimg.com/";

// Types
type SiteCandidate = {
  siteId: Id<"sites">;
  url_base: string;
  r2Prefix: string;
};

// Helper functions
const getDirectR2Url = (path: string): string => `${PUBLIC_R2_BASE_URL}${path}`;

const getR2Key = (
  cacheKey: string,
  prefix?: string,
  isDemo = false,
): string => {
  if (isDemo) {
    return `demo/${cacheKey}.png`;
  }
  if (!prefix) {
    throw new Error("Missing R2 prefix for production images");
  }
  return `${prefix}/${cacheKey}.png`;
};

const generateCacheKey = (url: string): string =>
  crypto.createHash("sha256").update(url).digest("hex");

// Validate URL and check security constraints
function validateUrl(url: string, nodeEnv: string): { isValid: boolean; validatedUrl?: URL; error?: string } {
  console.log(`[URL_VALIDATION_START] Validating URL: ${url}`);
  try {
    const validatedUrl = new URL(url);
    console.log(`[URL_VALIDATION_PROTOCOL] Protocol: ${validatedUrl.protocol}, Hostname: ${validatedUrl.hostname}`);

    if (!["http:", "https:"].includes(validatedUrl.protocol)) {
      console.warn(`[URL_VALIDATION_PROTOCOL_ERROR] Invalid protocol: ${validatedUrl.protocol}`);
      return { isValid: false, error: "Only HTTP and HTTPS URLs are supported" };
    }

    const hostname = validatedUrl.hostname.toLowerCase();
    const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].some(domain =>
      hostname === domain || hostname.includes(domain)
    );

    if (isLocalhost && nodeEnv === "production") {
      console.warn(`[URL_VALIDATION_LOCALHOST_ERROR] Localhost URL blocked in production: ${hostname}`);
      return { isValid: false, error: "Local URLs are not allowed" };
    }

    console.log(`[URL_VALIDATION_SUCCESS] URL validation passed for: ${url}`);
    return { isValid: true, validatedUrl };
  } catch (error) {
    console.error(`[URL_VALIDATION_ERROR] URL parsing failed:`, error);
    return { isValid: false, error: "Invalid URL provided" };
  }
}

// Take screenshot using Cloudflare Browser Rendering
async function takeScreenshot(url: string): Promise<ArrayBuffer | null> {
  console.log(`[SCREENSHOT_START] Starting screenshot for URL: ${url}`);
  const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: apiToken } = process.env;

  if (!accountId || !apiToken) {
    console.error("[SCREENSHOT_CONFIG_ERROR] Missing Cloudflare configuration - check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
    return null;
  }

  console.log(`[SCREENSHOT_CONFIG] Using account ID: ${accountId}`);

  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;
    console.log(`[SCREENSHOT_API_CALL] Making request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        viewport: { width: 1200 * 1.3, height: 630 * 1.3 },
        gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
        addStyleTag: [{ content: "* { overflow: hidden; }" }],
      }),
    });

    if (response.ok) {
      console.log(`[SCREENSHOT_SUCCESS] Screenshot generated successfully for ${url}`);
      return response.arrayBuffer();
    } else {
      const errorText = await response.text();
      console.error(`[SCREENSHOT_API_ERROR] API request failed: ${response.status} ${response.statusText}`, errorText);
      return null;
    }
  } catch (error) {
    console.error("[SCREENSHOT_ERROR] Screenshot generation failed:", error);
    return null;
  }
}

export const generateOgImage = action({
  args: {
    url: v.string(),
    isDemo: v.boolean(),
  },
  handler: async (ctx, args) => {
    console.log("[API_REQUEST_START] Processing OG image request");
    const nodeEnv = process.env.NODE_ENV ?? "development";

    try {
      const { url, isDemo } = args;
      console.log(`[API_REQUEST_URL] Requested URL: ${url}, Demo mode: ${isDemo}`);

      // Validate URL
      const { isValid, error } = validateUrl(url, nodeEnv);
      if (!isValid) {
        console.warn(`[API_REQUEST_VALIDATION_FAILED] URL validation failed: ${error}`);
        return {
          error,
          status: 400,
        };
      }

      const cacheKey = generateCacheKey(url);
      console.log(`[API_REQUEST_CACHE_KEY] Generated cache key: ${cacheKey}`);

      // Check cache based on mode
      let cachedImageUrl: string | null = null;
      let selectedSite: SiteCandidate | null = null;
      let imageKey: string | null = null;

      if (isDemo) {
        imageKey = getR2Key(cacheKey, undefined, true);
        // Check if image exists in R2
        console.log(
          `[DEMO_CACHE_CHECK_START] Checking R2 cache for key: ${imageKey}`,
        );
        const exists = await ctx.runQuery(api.r2.objectExists, {
          key: imageKey,
        });

        if (exists) {
          cachedImageUrl = getDirectR2Url(imageKey);
          console.log(
            `[DEMO_CACHE_CHECK_HIT] Cache hit! Found image: ${cachedImageUrl}`,
          );
          return {
            imageUrl: cachedImageUrl,
            cached: true,
            redirect: false,
          };
        }
        console.log(
          `[DEMO_CACHE_CHECK_MISS] No cached image found for key: ${imageKey}`,
        );
      } else {
        // Import extractUrlParts
        const { extractUrlParts } = await import("./utils/url");
        const urlBase = extractUrlParts(url).urlBase;
        console.log(`[API_REQUEST_URL_BASE] Extracted URL base: ${urlBase}`);

        const sitesResult = await ctx.runQuery(api.ogImages.getSitesForUrlBase, {
          urlBase,
        });

        if (sitesResult.sites.length === 0) {
          console.warn(`[API_REQUEST_WEBSITE_NOT_FOUND] No website found for URL base: ${urlBase}`);
          return {
            error: "Website must be added to Mosaic before generating OG images",
            status: 404,
          };
        }

        // Check for cached images across all sites
        for (const site of sitesResult.sites) {
          const siteImageKey = getR2Key(cacheKey, site.r2Prefix, false);
          const exists = await ctx.runQuery(api.r2.objectExists, {
            key: siteImageKey,
          });

          if (exists) {
            cachedImageUrl = getDirectR2Url(siteImageKey);
            console.log(
              `[API_REQUEST_CACHE_HIT] Redirecting to cached image: ${cachedImageUrl}`,
            );
            return {
              imageUrl: cachedImageUrl,
              cached: true,
              redirect: true,
            };
          }
        }

        selectedSite = sitesResult.selectedSite;
        if (!selectedSite) {
          console.warn(
            "[API_REQUEST_LIMIT_EXCEEDED] All website owners have exceeded their image limits",
          );
          return {
            error: "OG image limit exceeded for this plan. Please upgrade your subscription.",
            status: 403,
          };
        }

        imageKey = getR2Key(
          cacheKey,
          selectedSite.r2Prefix,
          false,
        );
      }

      // Generate screenshot
      const imageBuffer = await takeScreenshot(url);
      if (!imageBuffer) {
        console.error("[API_REQUEST_SCREENSHOT_FAILED] Failed to generate screenshot");
        return {
          error: "Failed to take screenshot",
          status: 500,
        };
      }

      // Upload to R2
      if (!isDemo && !imageKey) {
        console.error("[API_REQUEST_ERROR] Missing R2 key for production image");
        return {
          error: "Internal server error",
          status: 500,
        };
      }

      const finalImageKey = imageKey ?? getR2Key(cacheKey, undefined, true);
      console.log(
        `[R2_UPLOAD_START] Starting R2 upload for key: ${finalImageKey} (${isDemo ? "DEMO" : "PROD"})`,
      );
      console.log(`[R2_UPLOAD_CONFIG] Key: ${finalImageKey}, Size: ${imageBuffer.byteLength} bytes`);

      let uploadResult: { url: string; key: string; isNew: boolean } | null = null;

      try {
        await ctx.runAction(api.r2.storeImage, {
          key: finalImageKey,
          contentType: "image/png",
          dataBase64: Buffer.from(imageBuffer).toString("base64"),
        });

        const directUrl = getDirectR2Url(finalImageKey);
        console.log(`[R2_UPLOAD_SUCCESS] Successfully uploaded to R2, direct URL: ${directUrl}`);
        uploadResult = { url: directUrl, key: finalImageKey, isNew: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("Metadata already exists for key")) {
          const directUrl = getDirectR2Url(finalImageKey);
          console.warn(
            `[R2_UPLOAD_DUPLICATE] R2 key already exists, using cached URL: ${directUrl}`,
          );
          uploadResult = { url: directUrl, key: finalImageKey, isNew: false };
        } else {
          console.error("[R2_UPLOAD_ERROR] R2 upload failed:", error);
        }
      }

      if (!uploadResult) {
        console.warn("[API_REQUEST_R2_FAILED] R2 upload failed");
        if (isDemo) {
          // For demo mode, return base64 fallback
          const base64Image = Buffer.from(imageBuffer).toString("base64");
          console.log("[API_REQUEST_DEMO_FALLBACK] Returning base64 fallback for demo");
          return {
            imageUrl: `data:image/png;base64,${base64Image}`,
            cached: false,
            fallback: true,
            redirect: false,
          };
        } else {
          // For production mode, return base64 as fallback
          console.log("[API_REQUEST_PROD_FALLBACK] Returning base64 fallback for production");
          const base64Image = Buffer.from(imageBuffer).toString("base64");
          return {
            imageUrl: `data:image/png;base64,${base64Image}`,
            cached: false,
            fallback: true,
            redirect: false,
          };
        }
      }

      if (isDemo) {
        console.log(`[API_REQUEST_DEMO_SUCCESS] Successfully processed demo request: ${uploadResult.url}`);
        return {
          imageUrl: uploadResult.url,
          cached: false,
          redirect: false,
        };
      } else {
        // Store in database - only for production mode
        if (selectedSite) {
          const imageSize = Buffer.from(imageBuffer).length;
          console.log(
            `[API_REQUEST_DB_STORAGE] Starting database storage (image size: ${imageSize} bytes)`,
          );
          await ctx.runMutation(api.ogImages.storeImageForSite, {
            siteId: selectedSite.siteId,
            pageUrl: url,
            imageSize,
            imageKey: uploadResult.key,
            isNew: uploadResult.isNew,
          });
        }

        console.log(`[API_REQUEST_SUCCESS] Successfully processed request: ${uploadResult.url}`);
        return {
          imageUrl: uploadResult.url,
          cached: false,
          redirect: true,
        };
      }
    } catch (error) {
      console.error("[API_REQUEST_ERROR] Unexpected error in OG Image API:", error);
      return {
        error: "Internal server error",
        status: 500,
      };
    }
  },
});
