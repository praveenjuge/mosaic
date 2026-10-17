import { buildDashboardStats, type DashboardWebsiteRow } from "@/lib/dashboard";
import { getDb } from "@/lib/db";
import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { createServerFn } from "@tanstack/react-start";
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
    const [websitesResult, latestImagesResult] = await session.batch([
      session
        .prepare(
          `SELECT s.id,
                  s.url_base,
                  s.created_at,
                  COUNT(g.page_url) AS image_count,
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
           LIMIT 10`,
        )
        .bind(context.userId),
    ]);

    return buildDashboardStats(
      (websitesResult as D1Result<DashboardWebsiteRow>).results,
      (latestImagesResult as D1Result<DashboardImageSummary>).results,
    );
  });
