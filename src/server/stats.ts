import {
  buildDashboardStats,
  type DashboardImageAggregateRow,
  type DashboardImageRow,
  type DashboardSiteRow,
} from "@/lib/dashboard";
import { getDb } from "@/lib/db";
import type { DashboardStats } from "@/lib/types";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

// ── Helpers ─────────────────────────────────────────────────────────

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    total_images: 0,
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

    const [sitesResult, imageAggregatesResult, latestImagesResult] =
      await session.batch([
        session
          .prepare(
            "SELECT id, url_base, created_at FROM sites WHERE user_id = ? ORDER BY created_at DESC",
          )
          .bind(userId),
        session
          .prepare(
            `SELECT g.hostname,
                    COUNT(*) AS image_count,
                    MAX(g.generated_at) AS last_generated_at
             FROM global_images g
             WHERE EXISTS (
               SELECT 1
               FROM sites s
               WHERE s.user_id = ? AND s.url_base = g.hostname
             )
             GROUP BY g.hostname`,
          )
          .bind(userId),
        session
          .prepare(
            `SELECT g.key,
                    g.page_url,
                    g.size_in_bytes,
                    g.generated_at,
                    g.hostname AS url_base
             FROM global_images g
             WHERE EXISTS (
               SELECT 1
               FROM sites s
               WHERE s.user_id = ? AND s.url_base = g.hostname
             )
             ORDER BY g.generated_at DESC
             LIMIT 10`,
          )
          .bind(userId),
      ]);

    // Expired metadata remains part of history because its R2 object is kept
    // as the stale fallback until a successful automatic regeneration replaces
    // the same canonical page record.
    return buildDashboardStats(
      (sitesResult as D1Result<DashboardSiteRow>).results,
      (imageAggregatesResult as D1Result<DashboardImageAggregateRow>).results,
      (latestImagesResult as D1Result<DashboardImageRow>).results,
    );
  },
);
