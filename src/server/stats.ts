import {
  buildDashboardBudget,
  buildDashboardStats,
  type BudgetRow,
  type DashboardWebsiteRow,
} from "@/lib/dashboard";
import { getDb } from "@/lib/db";
import { queryLocalEvents } from "@/lib/local-analytics";
import {
  analyticsQueries,
  analyticsWindowStart,
  summarizeAnalytics,
  TOP_PAGES_LIMIT,
  type AnalyticsRow,
  type DashboardAnalytics,
  type TopPageRow,
} from "@/lib/site-analytics";
import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { utcDayStart } from "./generation-usage";
import { authMiddleware } from "./middleware";

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
    // it as a covering index; the second still sorts the user's images.
    const dayStart = utcDayStart();
    const [websitesResult, latestImagesResult, budgetResult] =
      await session.batch([
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
        session
          .prepare(
            `SELECT g.key,
                  g.page_url,
                  g.size_in_bytes,
                  g.generated_at,
                  g.hostname AS url_base
           FROM global_images g
           JOIN sites s ON s.url_base = g.hostname
           WHERE s.user_id = ?
           ORDER BY g.generated_at DESC
           LIMIT 12`,
          )
          .bind(context.userId),
        // Today's screenshots across the service and those the user started
        // (adding sites, regenerating pages). Older windows count as zero.
        session
          .prepare(
            `SELECT scope, count FROM generation_budgets
           WHERE window_start = ?
             AND ((scope = 'production-global' AND budget_key = 'service')
               OR (scope = 'production-client' AND budget_key = ?))`,
          )
          .bind(dayStart, `user:${context.userId}`),
      ]);

    return buildDashboardStats(
      (websitesResult as D1Result<DashboardWebsiteRow>).results,
      (latestImagesResult as D1Result<DashboardImageSummary>).results,
      buildDashboardBudget(
        (budgetResult as D1Result<BudgetRow>).results,
        dayStart,
      ),
    );
  });

/** Traffic for the given hostnames over the chart's days. */
/** Hostname batches (two queries each) queried at once. */
const BATCH_CONCURRENCY = 5;

async function querySiteAnalytics(
  hostnames: string[],
): Promise<DashboardAnalytics> {
  if (import.meta.env.DEV) {
    // Local writes never reach the deployed dataset, so dev reads its own.
    const { rows, topPages } = queryLocalEvents(
      hostnames,
      analyticsWindowStart(),
      TOP_PAGES_LIMIT,
    );
    return summarizeAnalytics(rows, topPages);
  }

  const batches = analyticsQueries(
    env.OG_ANALYTICS_DATASET,
    hostnames,
    analyticsWindowStart(),
  );
  if (!batches) return summarizeAnalytics([], []);
  try {
    // A few batches at a time stays inside the SQL API's concurrency limit.
    const results = [];
    for (let start = 0; start < batches.length; start += BATCH_CONCURRENCY) {
      results.push(
        ...(await Promise.all(
          batches
            .slice(start, start + BATCH_CONCURRENCY)
            .map(({ breakdown, topPages }) =>
              Promise.all([
                env.ANALYTICS_SQL.query<AnalyticsRow>(breakdown),
                env.ANALYTICS_SQL.query<TopPageRow>(topPages),
              ]),
            ),
        )),
      );
    }
    return summarizeAnalytics(
      results.flatMap(([breakdown]) => breakdown.data),
      results.flatMap(([, topPages]) => topPages.data),
    );
  } catch (error) {
    console.error("[ANALYTICS] Failed to query site analytics:", error);
    return { available: false };
  }
}

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
