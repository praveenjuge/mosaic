import { api } from "@/convex/_generated/api";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Utility functions
const getDirectR2Url = (imageKey: string, isDemo = false): string =>
  `https://og.mosaicimg.com/${isDemo ? 'demo/' : ''}${imageKey}`;

const generateCacheKey = (url: string): string =>
  crypto.createHash("sha256").update(url).digest("hex");

const redirectToImage = (url: string) =>
  NextResponse.redirect(url, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

// Check if demo image exists in R2
async function checkDemoImageInR2(cacheKey: string): Promise<string | null> {
  console.log(`[DEMO_CACHE_CHECK_START] Checking R2 cache for key: ${cacheKey}`);
  try {
    const exists = await fetchAction(api.r2.checkObjectExists, {
      key: `demo/${cacheKey}.png`,
    });

    // If no error, object exists - return direct R2 URL
    if (exists) {
      const cachedUrl = getDirectR2Url(`${cacheKey}.png`, true);
      console.log(`[DEMO_CACHE_CHECK_HIT] Cache hit! Found demo image: ${cachedUrl}`);
      return cachedUrl;
    }

    console.log(`[DEMO_CACHE_CHECK_MISS] No cached demo image found for key: ${cacheKey}`);
    return null;
  } catch (error: unknown) {
    console.error("[DEMO_CACHE_CHECK_ERROR] Error checking R2:", error);
    return null;
  }
}

// Upload to R2 and return direct public URL
async function uploadToR2(imageBuffer: ArrayBuffer, cacheKey: string, isDemo = false): Promise<string | null> {
  console.log(`[R2_UPLOAD_START] Starting R2 upload for cache key: ${cacheKey} (demo: ${isDemo})`);
  try {
    const imageKey = isDemo ? `demo/${cacheKey}.png` : `${cacheKey}.png`;
    console.log(`[R2_UPLOAD_CONFIG] Key: ${imageKey}, Size: ${imageBuffer.byteLength} bytes`);

    await fetchAction(api.r2.storeImage, {
      key: imageKey,
      contentType: "image/png",
      dataBase64: Buffer.from(imageBuffer).toString("base64"),
    });

    const directUrl = getDirectR2Url(isDemo ? `${cacheKey}.png` : imageKey, isDemo);
    console.log(`[R2_UPLOAD_SUCCESS] Successfully uploaded to R2, direct URL: ${directUrl}`);
    return directUrl;
  } catch (error) {
    console.error("[R2_UPLOAD_ERROR] R2 upload failed:", error);
    return null;
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

// Validate URL and check security constraints
function validateUrl(url: string): { isValid: boolean; validatedUrl?: URL; error?: string } {
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

    if (isLocalhost && process.env.NODE_ENV === "production") {
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

export async function GET(request: NextRequest) {
  console.log("[API_REQUEST_START] Processing OG image request");
  try {
    const url = new URL(request.url).searchParams.get("url");
    const isDemo = new URL(request.url).searchParams.get("demo") === "true";
    console.log(`[API_REQUEST_URL] Requested URL: ${url}, Demo mode: ${isDemo}`);

    if (!url) {
      console.warn("[API_REQUEST_NO_URL] Missing URL parameter");
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    // Validate URL
    const { isValid, error } = validateUrl(url);
    if (!isValid) {
      console.warn(`[API_REQUEST_VALIDATION_FAILED] URL validation failed: ${error}`);
      return NextResponse.json({ error }, { status: 400 });
    }

    const cacheKey = generateCacheKey(url);
    console.log(`[API_REQUEST_CACHE_KEY] Generated cache key: ${cacheKey}`);

    // Check cache based on mode
    let cachedImageUrl: string | null = null;
    if (isDemo) {
      cachedImageUrl = await checkDemoImageInR2(cacheKey);
      if (cachedImageUrl) {
        console.log(`[API_REQUEST_DEMO_CACHE_HIT] Returning cached demo image: ${cachedImageUrl}`);
        return NextResponse.json({
          imageUrl: cachedImageUrl,
          cached: true,
        });
      }
    } else {
      cachedImageUrl = await fetchQuery(api.ogImages.checkImageInDatabase, {
        pageUrl: url,
      });
      if (cachedImageUrl) {
        console.log(`[API_REQUEST_CACHE_HIT] Redirecting to cached image: ${cachedImageUrl}`);
        return redirectToImage(cachedImageUrl);
      }

      // Check if website exists (only for production mode)
      console.log("[API_REQUEST_WEBSITE_CHECK] Checking if website exists");
      const { urlBase } = extractUrlPartsConsistent(url);
      console.log(`[API_REQUEST_URL_BASE] Extracted URL base: ${urlBase}`);

      const websiteExists = await fetchQuery(
        api.ogImages.checkWebsiteExistsForUrl,
        { url_base: urlBase },
      );

      if (!websiteExists) {
        console.warn(`[API_REQUEST_WEBSITE_NOT_FOUND] No website found for URL base: ${urlBase}`);
        return NextResponse.json(
          { error: "Website must be added to Mosaic before generating OG images" },
          { status: 404 }
        );
      }

      console.log(`[API_REQUEST_WEBSITE_FOUND] Website exists, proceeding with screenshot`);
    }

    // Generate screenshot
    const imageBuffer = await takeScreenshot(url);
    if (!imageBuffer) {
      console.error("[API_REQUEST_SCREENSHOT_FAILED] Failed to generate screenshot");
      return NextResponse.json({ error: "Failed to take screenshot" }, { status: 500 });
    }

    // Upload to R2
    const uploadedUrl = await uploadToR2(imageBuffer, cacheKey, isDemo);

    if (!uploadedUrl) {
      console.warn("[API_REQUEST_R2_FAILED] R2 upload failed");
      if (isDemo) {
        // For demo mode, return base64 fallback
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        console.log("[API_REQUEST_DEMO_FALLBACK] Returning base64 fallback for demo");
        return NextResponse.json({
          imageUrl: `data:image/png;base64,${base64Image}`,
          cached: false,
          fallback: true,
        });
      } else {
        // For production mode, return image directly
        console.log("[API_REQUEST_PROD_FALLBACK] Returning image directly for production");
        return new NextResponse(Buffer.from(imageBuffer), {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }
    }

    if (isDemo) {
      console.log(`[API_REQUEST_DEMO_SUCCESS] Successfully processed demo request: ${uploadedUrl}`);
      return NextResponse.json({
        imageUrl: uploadedUrl,
        cached: false,
      });
    } else {
      // Store in database (background task) - only for production mode
      const imageSize = Buffer.from(imageBuffer).length;
      console.log(`[API_REQUEST_DB_STORAGE] Starting background database storage (image size: ${imageSize} bytes)`);
      fetchMutation(api.ogImages.storeImageInDatabase, {
        pageUrl: url,
        imageSize,
        uploadedUrl,
      }).catch((error) =>
        console.error(
          "[API_REQUEST_DB_STORAGE_ERROR] Background database storage failed:",
          error,
        ),
      );

      console.log(`[API_REQUEST_SUCCESS] Successfully processed request, redirecting to: ${uploadedUrl}`);
      return redirectToImage(uploadedUrl);
    }
  } catch (error) {
    console.error("[API_REQUEST_ERROR] Unexpected error in OG Image API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
