import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractUrlPartsConsistent } from "@/lib/utils";
import AWS from "aws-sdk";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get internal API URL for serving images
function getInternalApiUrl(imageKey: string, request: NextRequest): string {
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

// Upload image to R2 production bucket and return internal API URL
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

    // Always use internal API URL
    return getInternalApiUrl(imageKey, request);
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
    // Use service role client since we know the website exists
    const supabase = await createServiceRoleClient();

    // Parse URL to get base and path using consistent parsing
    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);

    // Get all existing websites with the same URL base (we know at least one exists)
    const { data: websitesData, error: websiteError } = await supabase
      .from("websites_new")
      .select("id, user_id")
      .eq("url_base", urlBase);

    if (websiteError || !websitesData || websitesData.length === 0) {
      console.error("Error getting websites:", websiteError);
      return;
    }

    // Randomly select one of the websites if multiple users have the same site
    const randomIndex = Math.floor(Math.random() * websitesData.length);
    const websiteData = websitesData[randomIndex];

    console.log(`Found ${websitesData.length} website(s) for ${urlBase}, randomly selected user ${websiteData.user_id}`);

    // Check if the page already exists for this website
    const { data: existingPage, error: pageCheckError } = await supabase
      .from("pages_new")
      .select("id")
      .eq("website_id", websiteData.id)
      .eq("path", path)
      .maybeSingle();

    if (pageCheckError) {
      console.error("Error checking existing page:", pageCheckError);
      return;
    }

    let pageData;
    if (existingPage) {
      // Page exists, use it
      pageData = existingPage;
      console.log(`Page exists, using existing page ${pageData.id}`);
    } else {
      // Create new page
      const { data: newPageData, error: pageError } = await supabase
        .from("pages_new")
        .insert({
          website_id: websiteData.id,
          user_id: websiteData.user_id,
          path: path,
          full_url: pageUrl,
        })
        .select("id")
        .single();

      if (pageError || !newPageData) {
        console.error("Error creating page:", pageError);
        return;
      }
      pageData = newPageData;
      console.log(`Created new page ${pageData.id}`);
    }

    // Finally, store the screenshot
    await supabase.from("screenshots_new").insert({
      page_id: pageData.id,
      screenshot_url: uploadedUrl,
      image_hash: imageKey,
      size_in_bytes: imageSize,
    });

    console.log(`Screenshot stored for page ${pageData.id} under user ${websiteData.user_id}`);
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

    console.log(`Database miss for ${url}, checking if website exists`);

    // Check if the website exists for any user before generating new image
    const supabase = await createServiceRoleClient();
    const { urlBase } = extractUrlPartsConsistent(url);

    const { data: existingWebsites, error: websiteCheckError } = await supabase
      .from("websites_new")
      .select("id, user_id")
      .eq("url_base", urlBase)
      .limit(1);

    if (websiteCheckError) {
      console.error("Error checking existing websites:", websiteCheckError);
      return NextResponse.json(
        { error: "Database error while checking website" },
        { status: 500 },
      );
    }

    if (!existingWebsites || existingWebsites.length === 0) {
      console.log(`No website found for ${urlBase}, refusing to generate image`);
      return NextResponse.json(
        { error: "Website must be added to your account before generating OG images" },
        { status: 404 },
      );
    }

    console.log(`Website exists for ${urlBase}, proceeding with screenshot generation`);

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
    // Website existence is already confirmed, so storage will succeed
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
