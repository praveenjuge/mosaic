import { getDb } from "@/lib/db";
import type { DashboardStats, Site } from "@/lib/types";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

// ── Helpers ─────────────────────────────────────────────────────────

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    websites: [],
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

    const sitesResult = await session
      .prepare(
        "SELECT id, url_base, created_at FROM sites WHERE user_id = ? ORDER BY created_at DESC",
      )
      .bind(userId)
      .all<Pick<Site, "id" | "url_base" | "created_at">>();

    const sites = sitesResult.results;
    const totalWebsites = sites.length;

    // Return raw data — formatting happens on the client
    const websites = sites.map((site) => ({
      id: site.id,
      url_base: site.url_base,
      created_at: site.created_at,
    }));

    return {
      total_websites: totalWebsites,
      websites,
    };
  },
);
