import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "@/lib/db";
import { IMAGES_LIMIT } from "@/lib/constants";
import { formatDate, formatNumber, formatLimit } from "@/lib/format";
import { buildPublicImageUrl, buildSiteOgImageUrl } from "@/lib/platform";
import { cleanDisplayUrl } from "@/lib/url";
import type { DashboardStats, Site } from "@/lib/types";

// ── Helpers ─────────────────────────────────────────────────────────

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    total_websites_display: "0",
    total_images: 0,
    total_images_display: "0",
    images_limit: IMAGES_LIMIT,
    images_limit_display: formatNumber(IMAGES_LIMIT),
    can_generate_more: false,
    has_exceeded_limit: false,
    websites: [],
    screenshot_counts: {},
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

    // 1. Get all sites for this user
    const sitesResult = await db
      .prepare("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC")
      .bind(userId)
      .all<Site>();

    const sites = sitesResult.results;

    // 2. Compute totals from image_count column
    const totalImages = sites.reduce(
      (sum, site) => sum + (site.image_count ?? 0),
      0,
    );
    const totalWebsites = sites.length;
    const hasExceededLimit = totalImages >= IMAGES_LIMIT;

    // 3. Build websites array
    const websites = sites.map((site) => {
      const fullUrl = `https://${site.url_base}`;
      return {
        id: site.id,
        url_base: site.url_base,
        full_url: fullUrl,
        og_image_usage_url: buildSiteOgImageUrl(
          "https://mosaicimg.com/",
          fullUrl,
        ),
        favicon_url: `https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`,
        created_at: site.created_at,
      };
    });

    // 4. Build screenshot_counts — Record<string, number> keyed by string site id
    const screenshot_counts: Record<string, number> = {};
    for (const site of sites) {
      screenshot_counts[`${site.id}`] = site.image_count ?? 0;
    }

    // 5. Get recent images via JOIN
    const recentImagesResult = await db
      .prepare(
        `SELECT i.*, s.url_base
         FROM images i
         JOIN sites s ON i.site_id = s.id
         WHERE s.user_id = ?
         ORDER BY i.generated_at DESC
         LIMIT 10`,
      )
      .bind(userId)
      .all<RecentImageRow>();

    const latest_screenshots = recentImagesResult.results.map((image) => {
      const pageUrl = image.page_url.replace(/\/+$/, "");
      return {
        id: String(image.id),
        screenshot_url: buildPublicImageUrl(image.key),
        size_in_bytes: image.size_in_bytes,
        generated_at: image.generated_at,
        formatted_date: formatDate(image.generated_at),
        page_url: pageUrl,
        display_url: cleanDisplayUrl(pageUrl),
        website_name: image.url_base ?? null,
      };
    });

    return {
      total_websites: totalWebsites,
      total_websites_display: formatNumber(totalWebsites),
      total_images: totalImages,
      total_images_display: formatNumber(totalImages),
      can_generate_more: !hasExceededLimit,
      has_exceeded_limit: hasExceededLimit,
      images_limit: IMAGES_LIMIT,
      images_limit_display: formatLimit(IMAGES_LIMIT),
      websites,
      screenshot_counts,
      latest_screenshots,
    };
  },
);
