import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "@/lib/db";
import { IMAGES_LIMIT } from "@/lib/constants";
import type { DashboardStats, Site } from "@/lib/types";

// ── Helpers ─────────────────────────────────────────────────────────

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    total_images: 0,
    images_limit: IMAGES_LIMIT,
    can_generate_more: false,
    has_exceeded_limit: false,
    websites: [],
    latest_screenshots: [],
  };
}

// ── Row type for the recent images JOIN query ───────────────────────

interface RecentImageRow {
  id: number;
  site_id: number;
  key: string;
  page_url: string;
  size_in_bytes: number;
  generated_at: number;
  created_at: string;
  url_base: string;
}

// ── Dashboard Stats ─────────────────────────────────────────────────

export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardStats> => {
    const { userId } = await auth();
    if (!userId) {
      return getEmptyDashboardStats();
    }

    const db = getDb();

    // Batch both queries into a single D1 round trip
    const [sitesResult, recentImagesResult] = await db.batch([
      db
        .prepare(
          "SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC",
        )
        .bind(userId),
      db
        .prepare(
          `SELECT i.*, s.url_base
           FROM images i
           JOIN sites s ON i.site_id = s.id
           WHERE s.user_id = ?
           ORDER BY i.generated_at DESC
           LIMIT 10`,
        )
        .bind(userId),
    ]);

    const sites = (sitesResult as D1Result<Site>).results;

    // Compute totals from image_count column
    const totalImages = sites.reduce(
      (sum, site) => sum + (site.image_count ?? 0),
      0,
    );
    const totalWebsites = sites.length;
    const hasExceededLimit = totalImages >= IMAGES_LIMIT;

    // Return raw data — formatting happens on the client
    const websites = sites.map((site) => ({
      id: site.id,
      url_base: site.url_base,
      image_count: site.image_count ?? 0,
      created_at: site.created_at,
      refreshed_at: site.refreshed_at ?? null,
    }));

    const latest_screenshots = (
      recentImagesResult as D1Result<RecentImageRow>
    ).results.map((image) => ({
      id: image.id,
      site_id: image.site_id,
      key: image.key,
      page_url: image.page_url.replace(/\/+$/, ""),
      size_in_bytes: image.size_in_bytes,
      generated_at: image.generated_at,
      url_base: image.url_base,
    }));

    return {
      total_websites: totalWebsites,
      total_images: totalImages,
      can_generate_more: !hasExceededLimit,
      has_exceeded_limit: hasExceededLimit,
      images_limit: IMAGES_LIMIT,
      websites,
      latest_screenshots,
    };
  },
);
