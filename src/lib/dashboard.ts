import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { stripTrailingSlashes } from "@/lib/url";

export type DashboardWebsiteRow = DashboardStats["websites"][number];

export function buildDashboardStats(
  websites: DashboardWebsiteRow[],
  latestImages: DashboardImageSummary[],
): DashboardStats {
  return {
    total_websites: websites.length,
    total_images: websites.reduce(
      (total, website) => total + website.image_count,
      0,
    ),
    websites,
    latest_screenshots: latestImages.map((image) => ({
      ...image,
      page_url: stripTrailingSlashes(image.page_url),
    })),
  };
}
