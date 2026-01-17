import { api } from "@/convex/_generated/api";
import { fetchAction } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const isDemo = searchParams.get("demo") === "true";

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  const result = await fetchAction(api.ogImageGeneration.generateOgImage, {
    url,
    isDemo,
  });

  // Handle error responses from Convex action
  if ("error" in result && typeof result.status === "number") {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Handle successful responses
  if ("imageUrl" in result) {
    if (isDemo || result.redirect === false) {
      // Demo mode: return JSON with imageUrl
      return NextResponse.json({
        imageUrl: result.imageUrl,
        cached: result.cached ?? false,
        fallback: result.fallback ?? false,
      });
    } else {
      // Production mode: return 301 redirect to imageUrl
      return NextResponse.redirect(result.imageUrl, {
        status: 301,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  // Fallback error response
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
