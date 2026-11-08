import type { DashboardAnalytics } from "@/lib/site-analytics";
import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { stripTrailingSlashes } from "@/lib/url";
import { querySiteAnalytics } from "@/server/analytics";
import { getDb } from "@/server/db";
import {
  dashboardBudget,
  dashboardBudgetStatement,
} from "@/server/generation-usage";
import { latestSiteImages } from "@/server/image-store";
import { authMiddleware } from "@/server/middleware";
import { createServerFn } from "@tanstack/react-start";

type WebsiteRow = DashboardStats["websites"][number];

/** Fetch dashboard stats for the signed-in user. */
export const getDashboardStats = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardStats> => {
    // Dashboard stats are read-only and tolerate slightly stale data, so a
    // session can hit the nearest read replica.
    const session = getDb().withSession();

    // Expired images stay in the counts: their R2 objects are kept as the
    // stale fallback until a regeneration replaces the same page record.
    // Both queries read images through the (hostname, generated_at) index.
    // Counting `g.hostname` (never NULL for a joined row) lets the first use
    // it as a covering index; `latestSiteImages` still sorts the user's
    // images.
    const [websites, latestImages, budget] = await session.batch([
      session
        .prepare(
          `SELECT s.id,
                  s.url_base,
                  s.created_at,
                  COUNT(g.hostname) AS image_count,
                  MAX(g.generated_at) AS last_generated_at
           FROM sites s
           LEFT JOIN global_images g ON g.hostname = s.url_base
           WHERE s.user_id = ?
           GROUP BY s.id
           ORDER BY s.created_at DESC`,
        )
        .bind(context.userId),
      latestSiteImages(session, context.userId),
      dashboardBudgetStatement(session, context.userId),
    ]);

    const websiteRows = (websites as D1Result<WebsiteRow>).results;
    return {
      total_websites: websiteRows.length,
      total_images: websiteRows.reduce(
        (total, website) => total + website.image_count,
        0,
      ),
      websites: websiteRows,
      latest_screenshots: (
        latestImages as D1Result<DashboardImageSummary>
      ).results.map((image) => ({
        ...image,
        page_url: stripTrailingSlashes(image.page_url),
      })),
      budget: dashboardBudget(
        (budget as D1Result<{ scope: string; count: number }>).results,
      ),
    };
  });

/**
 * Traffic for the signed-in user's websites over the last week. Loaded after
 * the stats, so a slow Analytics Engine query never holds up the dashboard;
 * it answers `{ available: false }` instead of failing.
 */
export const getDashboardAnalytics = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardAnalytics> => {
    try {
      const { results } = await getDb()
        .withSession()
        .prepare("SELECT url_base FROM sites WHERE user_id = ?")
        .bind(context.userId)
        .all<{ url_base: string }>();
      return await querySiteAnalytics(results.map(({ url_base }) => url_base));
    } catch (error) {
      console.error("[STATS] Failed to load analytics:", error);
      return { available: false };
    }
  });
