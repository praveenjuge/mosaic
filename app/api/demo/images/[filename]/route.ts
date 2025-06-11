import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Initialize R2 client
function getR2Client() {
  const r2AccessKeyId = process.env.DEMO_R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.DEMO_R2_SECRET_ACCESS_KEY;
  const r2AccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!r2AccessKeyId || !r2SecretAccessKey || !r2AccountId) {
    throw new Error("Missing Demo R2 configuration");
  }

  return new S3Client({
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
    region: "auto",
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
    const bucketName = process.env.DEMO_R2_BUCKET_NAME || "mosaic-screenshots";

    // Get the object from R2
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `screenshots/${filename}`,
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Convert stream to buffer for v3
    const chunks = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the image with proper headers
    return new NextResponse(buffer, {
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
      "name" in error &&
      error.name === "NoSuchKey"
    ) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    console.error("Error serving image from R2:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 },
    );
  }
}
