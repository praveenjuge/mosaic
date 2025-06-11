import AWS from "aws-sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Serves images from R2 through the app server
// Used as fallback when R2 public access is not configured
// or for backward compatibility with existing URLs

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    if (!filename || !filename.endsWith(".png")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const s3 = getR2Client();
    const bucketName = process.env.PROD_R2_BUCKET_NAME || "mosaic-og-prod";

    // Get the object from R2
    const object = await s3
      .getObject({
        Bucket: bucketName,
        Key: filename, // Direct key without subfolder for production
      })
      .promise();

    if (!object.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Return the image with proper headers
    return new NextResponse(object.Body as Buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "NoSuchKey"
    ) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    console.error("Error serving image from production R2:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 },
    );
  }
}
