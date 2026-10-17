import type { DashboardImageSummary, DashboardStats } from "@/lib/types";

export type DashboardSiteRow = {
  id: number;
  url_base: string;
  created_at: string;
};

export type DashboardImageAggregateRow = {
  hostname: string;
  image_count: number;
  last_generated_at: number;
};

export type DashboardImageRow = DashboardImageSummary;

export function buildDashboardStats(
  sites: DashboardSiteRow[],
  imageAggregates: DashboardImageAggregateRow[],
  latestImages: DashboardImageRow[],
): DashboardStats {
  const imagesByHostname = new Map(
    imageAggregates.map((row) => [row.hostname, row]),
  );

  return {
    total_websites: sites.length,
    total_images: imageAggregates.reduce(
      (total, row) => total + row.image_count,
      0,
    ),
    websites: sites.map((site) => {
      const imageStats = imagesByHostname.get(site.url_base);
      return {
        ...site,
        image_count: imageStats?.image_count ?? 0,
        last_generated_at: imageStats?.last_generated_at ?? null,
      };
    }),
    latest_screenshots: latestImages.map((image) => ({
      ...image,
      page_url: image.page_url.replace(/\/+$/, ""),
    })),
  };
}
