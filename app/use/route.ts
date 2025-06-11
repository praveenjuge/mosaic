import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Utility functions
const getDirectR2Url = (imageKey: string, isDemo = false): string =>
  `https://og.mosaicimg.com/${isDemo ? 'demo/' : ''}${imageKey}`;

const generateCacheKey = (url: string): string =>
  crypto.createHash("sha256").update(url).digest("hex");

const getR2Client = () => {
  const { PROD_R2_ACCESS_KEY_ID, PROD_R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID } = process.env;
  if (!PROD_R2_ACCESS_KEY_ID || !PROD_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_ACCOUNT_ID) {
    console.error("[R2_CLIENT_ERROR] Missing R2 configuration - check environment variables");
    throw new Error("Missing Production R2 configuration");
  }
  console.log("[R2_CLIENT_SUCCESS] R2 client initialized successfully");
  return new S3Client({
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: PROD_R2_ACCESS_KEY_ID,
      secretAccessKey: PROD_R2_SECRET_ACCESS_KEY,
    },
    region: "auto",
  });
};

// Check cache and return URL if exists (database for production, R2 for demo)
async function checkImageInDatabase(pageUrl: string): Promise<string | null> {
  console.log(`[CACHE_CHECK_START] Checking cache for URL: ${pageUrl}`);
  try {
    const supabase = await createServiceRoleClient();
    console.log("[CACHE_CHECK_DB] Supabase client created successfully");

    const { data } = await supabase
      .from("screenshots_new")
      .select("screenshot_url, pages_new!inner(full_url)")
      .eq("pages_new.full_url", pageUrl)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.screenshot_url) {
      console.log(`[CACHE_CHECK_HIT] Cache hit! Found image: ${data.screenshot_url}`);
      return data.screenshot_url;
    } else {
      console.log(`[CACHE_CHECK_MISS] No cached image found for ${pageUrl}`);
      return null;
    }
  } catch (error) {
    console.error("[CACHE_CHECK_ERROR] Cache check failed:", error);
    return null;
  }
}

// Check if demo image exists in R2
async function checkDemoImageInR2(cacheKey: string): Promise<string | null> {
  console.log(`[DEMO_CACHE_CHECK_START] Checking R2 cache for key: ${cacheKey}`);
  try {
    const s3 = getR2Client();
    const bucketName = process.env.PROD_R2_BUCKET_NAME || "mosaic-og-prod";

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: `demo/${cacheKey}.png`,
    });

    await s3.send(command);

    // If no error, object exists - return direct R2 URL
    const cachedUrl = getDirectR2Url(`${cacheKey}.png`, true);
    console.log(`[DEMO_CACHE_CHECK_HIT] Cache hit! Found demo image: ${cachedUrl}`);
    return cachedUrl;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "NotFound") {
      console.log(`[DEMO_CACHE_CHECK_MISS] No cached demo image found for key: ${cacheKey}`);
      return null;
    }
    console.error("[DEMO_CACHE_CHECK_ERROR] Error checking R2:", error);
    return null;
  }
}

// Upload to R2 and return direct public URL
async function uploadToR2(imageBuffer: ArrayBuffer, cacheKey: string, isDemo = false): Promise<string | null> {
  console.log(`[R2_UPLOAD_START] Starting R2 upload for cache key: ${cacheKey} (demo: ${isDemo})`);
  try {
    const s3 = getR2Client();
    const imageKey = isDemo ? `demo/${cacheKey}.png` : `${cacheKey}.png`;
    const bucketName = process.env.PROD_R2_BUCKET_NAME || "mosaic-og-prod";

    console.log(`[R2_UPLOAD_CONFIG] Bucket: ${bucketName}, Key: ${imageKey}, Size: ${imageBuffer.byteLength} bytes`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
      Body: Buffer.from(imageBuffer),
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000",
    });

    await s3.send(command);

    const directUrl = getDirectR2Url(isDemo ? `${cacheKey}.png` : imageKey, isDemo);
    console.log(`[R2_UPLOAD_SUCCESS] Successfully uploaded to R2, direct URL: ${directUrl}`);
    return directUrl;
  } catch (error) {
    console.error("[R2_UPLOAD_ERROR] R2 upload failed:", error);
    return null;
  }
}

// Store image metadata in database
async function storeImageInDatabase(pageUrl: string, imageKey: string, imageSize: number, uploadedUrl: string): Promise<void> {
  console.log(`[DB_STORE_START] Starting database storage for URL: ${pageUrl}`);
  try {
    const supabase = await createServiceRoleClient();
    console.log("[DB_STORE_CLIENT] Supabase client created successfully");

    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);
    console.log(`[DB_STORE_URL_PARSED] URL base: ${urlBase}, path: ${path}`);

    // Get random website for this URL base
    const { data: websitesData, error: websiteError } = await supabase
      .from("websites_new")
      .select("id, user_id")
      .eq("url_base", urlBase);

    if (websiteError) {
      console.error("[DB_STORE_WEBSITE_ERROR] Failed to fetch websites:", websiteError);
      return;
    }

    if (!websitesData?.length) {
      console.log(`[DB_STORE_NO_WEBSITES] No websites found for URL base: ${urlBase}`);
      return;
    }

    const website = websitesData[Math.floor(Math.random() * websitesData.length)];
    console.log(`[DB_STORE_WEBSITE_SELECTED] Selected website: ${website.id}, user: ${website.user_id} (${websitesData.length} total websites)`);

    // Get or create page
    const { data: pageData, error: pageSelectError } = await supabase
      .from("pages_new")
      .select("id")
      .eq("website_id", website.id)
      .eq("path", path)
      .maybeSingle();

    let page = pageData;

    if (pageSelectError) {
      console.error("[DB_STORE_PAGE_SELECT_ERROR] Failed to check existing page:", pageSelectError);
      return;
    }

    if (!page) {
      console.log(`[DB_STORE_PAGE_CREATE] Creating new page for path: ${path}`);
      const { data: newPage, error: pageCreateError } = await supabase
        .from("pages_new")
        .insert({
          website_id: website.id,
          user_id: website.user_id,
          path,
          full_url: pageUrl,
        })
        .select("id")
        .single();

      if (pageCreateError) {
        console.error("[DB_STORE_PAGE_CREATE_ERROR] Failed to create new page:", pageCreateError);
        return;
      }
      page = newPage;
      console.log(`[DB_STORE_PAGE_CREATED] Created new page with ID: ${page?.id}`);
    } else {
      console.log(`[DB_STORE_PAGE_EXISTS] Using existing page with ID: ${page.id}`);
    }

    if (page) {
      console.log(`[DB_STORE_SCREENSHOT_START] Storing screenshot for page ID: ${page.id}`);
      const { error: screenshotError } = await supabase.from("screenshots_new").insert({
        page_id: page.id,
        screenshot_url: uploadedUrl,
        image_hash: imageKey,
        size_in_bytes: imageSize,
        user_id: website.user_id,
      });

      if (screenshotError) {
        console.error("[DB_STORE_SCREENSHOT_ERROR] Failed to store screenshot:", screenshotError);
        return;
      }
      console.log(`[DB_STORE_SUCCESS] Successfully stored screenshot for page ${page.id}`);
    } else {
      console.error("[DB_STORE_NO_PAGE] No page available for screenshot storage");
    }
  } catch (error) {
    console.error("[DB_STORE_ERROR] Database storage error:", error);
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
        viewport: { width: 1200, height: 630 },
        gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
        addStyleTag: [{ content: "html, body { overflow: hidden; }" }],
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
      cachedImageUrl = await checkImageInDatabase(url);
      if (cachedImageUrl) {
        console.log(`[API_REQUEST_CACHE_HIT] Redirecting to cached image: ${cachedImageUrl}`);
        return NextResponse.redirect(cachedImageUrl, { status: 302 });
      }

      // Check if website exists (only for production mode)
      console.log("[API_REQUEST_WEBSITE_CHECK] Checking if website exists");
      const supabase = await createServiceRoleClient();
      const { urlBase } = extractUrlPartsConsistent(url);
      console.log(`[API_REQUEST_URL_BASE] Extracted URL base: ${urlBase}`);

      const { data: existingWebsites, error: websiteCheckError } = await supabase
        .from("websites_new")
        .select("id")
        .eq("url_base", urlBase)
        .limit(1);

      if (websiteCheckError) {
        console.error("[API_REQUEST_WEBSITE_CHECK_ERROR] Database error checking website:", websiteCheckError);
        return NextResponse.json({ error: "Database error while checking website" }, { status: 500 });
      }

      if (!existingWebsites?.length) {
        console.warn(`[API_REQUEST_WEBSITE_NOT_FOUND] No website found for URL base: ${urlBase}`);
        return NextResponse.json(
          { error: "Website must be added to your account before generating OG images" },
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
      storeImageInDatabase(url, `${cacheKey}.png`, imageSize, uploadedUrl).catch((error) =>
        console.error("[API_REQUEST_DB_STORAGE_ERROR] Background database storage failed:", error)
      );

      console.log(`[API_REQUEST_SUCCESS] Successfully processed request, redirecting to: ${uploadedUrl}`);
      return NextResponse.redirect(uploadedUrl, { status: 302 });
    }
  } catch (error) {
    console.error("[API_REQUEST_ERROR] Unexpected error in OG Image API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
