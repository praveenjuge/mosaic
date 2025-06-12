import { auth } from "@clerk/nextjs/server";
import { getWebsiteForUser, getPagesForWebsite } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the website belongs to the authenticated user
    const website = await getWebsiteForUser(websiteId, userId);

    if (!website) {
      return NextResponse.json(
        { error: "Website not found or access denied" },
        { status: 404 },
      );
    }

    // Get all pages for this website
    const pages = await getPagesForWebsite(websiteId);

    if (pages === null) {
      console.error("Error fetching pages");
      return NextResponse.json(
        { error: "Failed to fetch website pages" },
        { status: 500 },
      );
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        {
          message:
            "No pages found for this website. Try visiting some pages first.",
        },
        { status: 200 },
      );
    }

    // Trigger screenshot generation for each page by calling our internal /use API
    const host = request.headers.get("host") || "localhost:3002";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

    let successCount = 0;
    let failureCount = 0;

    // Process pages in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);

      const batchPromises = batch.map(async (page) => {
        try {
          const response = await fetch(
            `${protocol}://${host}/api/use?url=${encodeURIComponent(page.full_url)}`,
            {
              method: "GET",
              headers: {
                "User-Agent": "Mosaic-Refresh-Bot/1.0",
              },
            },
          );

          if (response.ok) {
            successCount++;
            return { success: true, url: page.full_url };
          } else {
            failureCount++;
            console.error(
              `Failed to refresh ${page.full_url}: ${response.status}`,
            );
            return {
              success: false,
              url: page.full_url,
              error: response.status,
            };
          }
        } catch (error) {
          failureCount++;
          console.error(`Error refreshing ${page.full_url}:`, error);
          return { success: false, url: page.full_url, error: "Network error" };
        }
      });

      await Promise.all(batchPromises);

      // Add a small delay between batches to be respectful
      if (i + batchSize < pages.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const totalPages = pages.length;
    const message = `Refresh completed. ${successCount}/${totalPages} pages refreshed successfully.`;

    if (failureCount > 0) {
      console.log(
        `Refresh summary for ${website.url_base}: ${successCount} success, ${failureCount} failures`,
      );
    }

    return NextResponse.json({
      message,
      website: website.url_base,
      totalPages,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("Refresh API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
