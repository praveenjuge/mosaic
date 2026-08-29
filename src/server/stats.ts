import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "@/lib/db";
import { getPlanImageLimit, IMAGES_LIMIT } from "@/lib/constants";
import type { DashboardStats, RecentImageRow, Site } from "@/lib/types";

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

// ── Dashboard Stats ─────────────────────────────────────────────────

/**
 * Fetch dashboard stats for the current user.
 *
 * NOTE: This intentionally does NOT use authMiddleware because
 * unauthenticated visitors should receive empty stats (the home
 * page renders a signed-out view based on this), not an error.
 */
export const getDashboardStats = createServerFn().handler(
  async (): Promise<DashboardStats> => {
    const { userId } = await auth();
    if (!userId) {
      return getEmptyDashboardStats();
    }

    const db = getDb();

    // Use a read session — dashboard stats are read-only and tolerate
    // slightly stale data, so we can hit the nearest read replica.
    const session = db.withSession();

    const [sitesResult, recentImagesResult, usageResult] = await session.batch([
      session
        .prepare(
          "SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC",
        )
        .bind(userId),
      session
        .prepare(
          `SELECT i.*, s.url_base
           FROM images i
           JOIN sites s ON i.site_id = s.id
           WHERE s.user_id = ?
           ORDER BY i.generated_at DESC
           LIMIT 10`,
        )
        .bind(userId),
      session
        .prepare(
          `SELECT plan, CASE
             WHEN period_start =
               CAST(strftime('%s', 'now', 'start of month') AS INTEGER) * 1000
               THEN COALESCE(generated_total, 0)
             ELSE 0
           END AS generated_total
           FROM user_usage WHERE user_id = ?`,
        )
        .bind(userId),
    ]);

    const sites = (sitesResult as D1Result<Site>).results;

    const usage = (
      usageResult as D1Result<{ generated_total: number; plan: string }>
    ).results[0];
    const totalImages = usage?.generated_total ?? 0;
    const imagesLimit = getPlanImageLimit(usage?.plan);
    const totalWebsites = sites.length;
    const hasExceededLimit = totalImages >= imagesLimit;

    // Return raw data — formatting happens on the client
    const websites = sites.map((site) => ({
      id: site.id,
      url_base: site.url_base,
      image_count: site.image_count ?? 0,
      created_at: site.created_at,
      refreshed_at: site.refreshed_at ?? null,
      verification_token: site.verification_token ?? null,
      verified_at: site.verified_at ?? null,
      generation_secret: site.generation_secret ?? null,
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
      images_limit: imagesLimit,
      websites,
      latest_screenshots,
    };
  },
);
