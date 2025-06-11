import { createClient } from "@/lib/supabase/server";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import AWS from "aws-sdk";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
async function checkImageInDatabase(pageUrl: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    // Parse URL to get base and path
    const parsedUrl = new URL(pageUrl);
    const urlBase = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

    // Use optimized query approach - remove .single() to avoid the error and use limit
    const { data, error } = await supabase
      .from("screenshots_new")
      .select(
        `
        screenshot_url,
        pages_new!inner(
          id,
          websites_new!inner(
            id,
            url_base
          )
        )
      `,
      )
      .eq("pages_new.websites_new.url_base", urlBase)
      .eq("pages_new.path", path)
      .order("generated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].screenshot_url;
  } catch (error) {
    console.error("Error checking database:", error);
    return null;
  }
}

// Upload image to R2 production bucket
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

    // Return internal API URL instead of direct R2 URL for better reliability
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${host}/api/prod-images/${imageKey}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return null;
  }
}

// Store image metadata in new database structure
async function storeImageInDatabase(
  pageUrl: string,
  imageKey: string,
  imageSize: number,
  uploadedUrl: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Parse URL to get base and path using consistent parsing
    const { urlBase, path, hostname } = extractUrlPartsConsistent(pageUrl);

    // Get user ID from auth context (if available)
    let userId = "public"; // Default for public usage
    try {
      const { userId: authUserId } = await auth();
      if (authUserId) {
        userId = authUserId;
      }
    } catch {
      // Auth might not be available for public API usage
      console.log("No auth context available, using public user");
    }

    // First, ensure website exists
    const { data: websiteData, error: websiteError } = await supabase
      .from("websites_new")
      .select("id")
      .eq("url_base", urlBase)
      .eq("user_id", userId)
      .single();

    let websiteId;
    if (websiteError || !websiteData) {
      // Create new website
      const { data: newWebsite, error: createWebsiteError } = await supabase
        .from("websites_new")
        .insert({
          user_id: userId,
          url_base: urlBase,
          site_name: hostname,
        })
        .select("id")
        .single();

      if (createWebsiteError || !newWebsite) {
        console.error("Error creating website:", createWebsiteError);
        return;
      }
      websiteId = newWebsite.id;
    } else {
      websiteId = websiteData.id;
    }

    // Next, ensure page exists
    const { data: pageData, error: pageError } = await supabase
      .from("pages_new")
      .select("id")
      .eq("website_id", websiteId)
      .eq("path", path)
      .single();

    let pageId;
    if (pageError || !pageData) {
      // Create new page
      const { data: newPage, error: createPageError } = await supabase
        .from("pages_new")
        .insert({
          website_id: websiteId,
          path: path,
          full_url: pageUrl,
        })
        .select("id")
        .single();

      if (createPageError || !newPage) {
        console.error("Error creating page:", createPageError);
        return;
      }
      pageId = newPage.id;
    } else {
      pageId = pageData.id;
    }

    // Finally, store the screenshot
    await supabase.from("screenshots_new").insert({
      page_id: pageId,
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
      console.log(`Database hit for ${url}`);

      // If the cached URL is a direct R2 URL, convert it to internal API URL
      if (cachedImageUrl.includes(".r2.cloudflarestorage.com/")) {
        // Extract the image key from the R2 URL
        const imageKey = cachedImageUrl.split("/").pop();
        if (imageKey) {
          const host = request.headers.get("host") || "localhost:3000";
          const protocol =
            process.env.NODE_ENV === "production" ? "https" : "http";
          const internalUrl = `${protocol}://${host}/api/prod-images/${imageKey}`;
          return NextResponse.redirect(internalUrl);
        }
      }

      // Redirect to the image URL instead of returning JSON
      return NextResponse.redirect(cachedImageUrl);
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

    // Store image metadata in database
    const imageSize = Buffer.from(imageBuffer).length;
    await storeImageInDatabase(url, `${cacheKey}.png`, imageSize, uploadedUrl);

    console.log(`Successfully uploaded screenshot for ${url} to R2`);

    // Redirect to the uploaded image
    return NextResponse.redirect(uploadedUrl);
  } catch (error) {
    console.error("OG Image API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
