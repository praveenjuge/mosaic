import AWS from "aws-sdk";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Generate a hash from URL for consistent cache keys
function generateCacheKey(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

// Initialize R2 client
function getR2Client() {
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2AccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!r2AccessKeyId || !r2SecretAccessKey || !r2AccountId) {
    throw new Error("Missing R2 configuration");
  }

  return new AWS.S3({
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    region: "auto",
    signatureVersion: "v4",
  });
}

// Check if image exists in R2
async function checkImageInR2(
  cacheKey: string,
  request: NextRequest,
): Promise<string | null> {
  try {
    const s3 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || "mosaic-screenshots";

    await s3
      .headObject({
        Bucket: bucketName,
        Key: `screenshots/${cacheKey}.png`,
      })
      .promise();

    // If no error, object exists - return our internal API URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${host}/api/images/${cacheKey}.png`;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "NotFound"
    ) {
      return null;
    }
    console.error("Error checking R2:", error);
    return null;
  }
}

// Upload image to R2
async function uploadToR2(
  imageBuffer: ArrayBuffer,
  cacheKey: string,
  request: NextRequest,
): Promise<string | null> {
  try {
    const s3 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || "mosaic-screenshots";

    await s3
      .upload({
        Bucket: bucketName,
        Key: `screenshots/${cacheKey}.png`,
        Body: Buffer.from(imageBuffer),
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000", // Cache for 1 year
      })
      .promise();

    // Return internal API URL instead of public R2 URL for better reliability
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${host}/api/images/${cacheKey}.png`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return null;
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

    // Cloudflare Browser Rendering API returns binary PNG data directly
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

    const cacheKey = generateCacheKey(url);
    console.log(
      `Processing screenshot request for URL: ${url}, Cache key: ${cacheKey}`,
    );

    // Check if image exists in cache
    const cachedImageUrl = await checkImageInR2(cacheKey, request);
    if (cachedImageUrl) {
      console.log(`Cache hit for ${url}`);
      return NextResponse.json({
        imageUrl: cachedImageUrl,
        cached: true,
      });
    }

    console.log(`Cache miss for ${url}, generating new screenshot`);

    // Take new screenshot
    const imageBuffer = await takeScreenshot(url);
    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Failed to take screenshot" },
        { status: 500 },
      );
    }

    console.log(`Screenshot generated for ${url}, uploading to R2`);

    // Upload to R2
    const uploadedUrl = await uploadToR2(imageBuffer, cacheKey, request);
    if (!uploadedUrl) {
      console.log(`R2 upload failed for ${url}, returning base64 image`);
      // If upload fails, return the image buffer directly as base64
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      return NextResponse.json({
        imageUrl: `data:image/png;base64,${base64Image}`,
        cached: false,
        fallback: true,
      });
    }

    console.log(`Successfully uploaded screenshot for ${url} to R2`);
    return NextResponse.json({
      imageUrl: uploadedUrl,
      cached: false,
    });
  } catch (error) {
    console.error("Screenshot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
