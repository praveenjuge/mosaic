import { createServiceRoleClient, createClerkSupabaseServerClient } from "@/lib/supabase/server";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import AWS from "aws-sdk";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Generate direct R2 URL for public access
function getDirectR2Url(imageKey: string): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.PROD_R2_BUCKET_NAME || "mosaic-og-prod";

  // Option 1: Use R2 custom domain (recommended for production)
  const customDomain = process.env.R2_PUBLIC_DOMAIN;
  if (customDomain) {
    return `https://${customDomain}/${imageKey}`;
  }

  // Option 2: Use R2.dev public URL (if configured)
  const r2DevUrl = process.env.R2_DEV_URL;
  if (r2DevUrl) {
    return `${r2DevUrl}/${imageKey}`;
  }

  // Option 3: Direct R2 URL (requires public bucket access)
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${imageKey}`;
}

// Check if R2 public access is working by testing a URL
async function testR2PublicAccess(testUrl: string): Promise<boolean> {
  try {
    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Get fallback URL (internal API) when R2 public access is not available
function getFallbackUrl(imageKey: string, request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}/api/prod-images/${imageKey}`;
}

// Generate a hash from URL for consistent cache keys
function generateCacheKey(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

// Initialize R2 client for production bucket
function getR2Client() {
  const r2AccessKeyId = process.env.PROD_R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.PROD_R2_SECRET_ACCESS_KEY;
  const r2AccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!r2AccessKeyId || !r2SecretAccessKey || !r2AccountId) {
    throw new Error("Missing Production R2 configuration");
  }

  return new AWS.S3({
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    region: "auto",
    signatureVersion: "v4",
  });
}

// Check if image exists in database by page URL using optimized query
// Uses service role client to bypass RLS and check cached images across all users
async function checkImageInDatabase(pageUrl: string): Promise<string | null> {
  try {
    const supabase = await createServiceRoleClient();

    console.log(`Checking cache for URL: ${pageUrl}`);

    // Direct query using full_url - this is the fastest approach
    const { data, error } = await supabase
      .from("screenshots_new")
      .select(`
        screenshot_url,
        pages_new!inner(full_url)
      `)
      .eq("pages_new.full_url", pageUrl)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Database query error:", error);
      return null;
    }

    if (!data) {
      console.log(`No cached image found for ${pageUrl}`);
      return null;
    }

    console.log(`Cache hit! Found image: ${data.screenshot_url}`);
    return data.screenshot_url;
  } catch (error) {
    console.error("Error checking database:", error);
    return null;
  }
}

// Upload image to R2 production bucket and return appropriate URL
async function uploadToR2(
  imageBuffer: ArrayBuffer,
  cacheKey: string,
  request: NextRequest,
): Promise<string | null> {
  try {
    const s3 = getR2Client();
    const bucketName = process.env.PROD_R2_BUCKET_NAME || "mosaic-og-prod";
    const imageKey = `${cacheKey}.png`;

    await s3
      .upload({
        Bucket: bucketName,
        Key: imageKey,
        Body: Buffer.from(imageBuffer),
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000", // Cache for 1 year
      })
      .promise();

    // Check if R2 public access is configured
    const directR2Url = getDirectR2Url(imageKey);
    const isR2PublicAccessEnabled = await testR2PublicAccess(directR2Url);

    if (isR2PublicAccessEnabled) {
      console.log("Using direct R2 URL for better performance");
      return directR2Url;
    } else {
      console.log("R2 public access not configured, falling back to internal API");
      return getFallbackUrl(imageKey, request);
    }
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return null;
  }
}

// Store image metadata in new database structure with optimized queries
async function storeImageInDatabase(
  pageUrl: string,
  imageKey: string,
  imageSize: number,
  uploadedUrl: string,
): Promise<void> {
  try {
    // Get user ID from auth context (if available)
    let userId: string | null = null;
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) {
        userId = authUserId;
        console.log("Authenticated request from user:", userId);
      }
    } catch (authError) {
      console.log("Auth error or no auth context:", authError);
    }

    // Only store in database if there's an authenticated user
    // This prevents duplicates between user-added websites and public API usage
    if (!userId) {
      console.log("Skipping database storage for anonymous image generation");
      return;
    }

    // Use authenticated client when user is authenticated
    const supabase = await createClerkSupabaseServerClient();

    // Parse URL to get base and path using consistent parsing
    const { urlBase, path, hostname } = extractUrlPartsConsistent(pageUrl);

    // Use upsert operations for better performance and handle conflicts
    // First, upsert website
    const { data: websiteData, error: websiteError } = await supabase
      .from("websites_new")
      .upsert({
        user_id: userId,
        url_base: urlBase,
        site_name: hostname,
      }, {
        onConflict: 'user_id,url_base',
        ignoreDuplicates: false
      })
      .select("id")
      .single();

    if (websiteError || !websiteData) {
      console.error("Error upserting website:", websiteError);
      return;
    }

    // Next, upsert page
    const { data: pageData, error: pageError } = await supabase
      .from("pages_new")
      .upsert({
        website_id: websiteData.id,
        path: path,
        full_url: pageUrl,
      }, {
        onConflict: 'website_id,path',
        ignoreDuplicates: false
      })
      .select("id")
      .single();

    if (pageError || !pageData) {
      console.error("Error upserting page:", pageError);
      return;
    }

    // Finally, store the screenshot
    await supabase.from("screenshots_new").insert({
      page_id: pageData.id,
      screenshot_url: uploadedUrl,
      image_hash: imageKey,
      size_in_bytes: imageSize,
    });
  } catch (error) {
    console.error("Error storing image in database:", error);
  }
}

// Take screenshot using Cloudflare Browser Rendering
async function takeScreenshot(url: string): Promise<ArrayBuffer | null> {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error("Missing Cloudflare configuration");
      return null;
    }

    const screenshotUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;

    const response = await fetch(screenshotUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        viewport: {
          width: 1200,
          height: 630,
        },
        gotoOptions: {
          waitUntil: "networkidle0",
          timeout: 30000,
        },
        addStyleTag: [
          {
            content: "html, body { overflow: hidden; }",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Screenshot API error:",
        response.status,
        response.statusText,
        errorText,
      );
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error taking screenshot:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    // Validate URL format and protocol
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!["http:", "https:"].includes(validatedUrl.protocol)) {
        return NextResponse.json(
          { error: "Only HTTP and HTTPS URLs are supported" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 },
      );
    }

    // Basic security checks
    const hostname = validatedUrl.hostname.toLowerCase();
    const blockedDomains = ["localhost", "127.0.0.1", "0.0.0.0"];
    const isLocalhost = blockedDomains.some(
      (domain) => hostname === domain || hostname.includes(domain),
    );

    if (isLocalhost && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Local URLs are not allowed" },
        { status: 400 },
      );
    }

    console.log(`Processing OG image request for URL: ${url}`);

    // Check if image exists in database
    const cachedImageUrl = await checkImageInDatabase(url);
    if (cachedImageUrl) {
      console.log(`Database hit for ${url}, redirecting immediately`);
      // Redirect directly to the cached image URL for fastest performance
      return NextResponse.redirect(cachedImageUrl, { status: 302 });
    }

    console.log(`Database miss for ${url}, generating new screenshot`);

    // Take new screenshot
    const imageBuffer = await takeScreenshot(url);
    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Failed to take screenshot" },
        { status: 500 },
      );
    }

    console.log(`Screenshot generated for ${url}, uploading to R2`);

    // Generate cache key and upload to R2
    const cacheKey = generateCacheKey(url);
    const uploadedUrl = await uploadToR2(imageBuffer, cacheKey, request);

    if (!uploadedUrl) {
      console.log(`R2 upload failed for ${url}, returning base64 image`);
      // If upload fails, return the image buffer directly
      return new NextResponse(Buffer.from(imageBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // Store image metadata in database (don't await to improve response time)
    const imageSize = Buffer.from(imageBuffer).length;
    storeImageInDatabase(url, `${cacheKey}.png`, imageSize, uploadedUrl).catch(
      (error) => console.error("Background database storage failed:", error)
    );

    console.log(`Successfully uploaded screenshot for ${url} to R2`);

    // Redirect directly to the R2 URL (bypasses app server for better performance)
    return NextResponse.redirect(uploadedUrl, { status: 302 });
  } catch (error) {
    console.error("OG Image API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
