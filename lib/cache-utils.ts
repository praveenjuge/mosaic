import { revalidateTag } from "next/cache";

/**
 * Utility functions for managing user stats cache invalidation
 */

export async function invalidateUserStatsCache(userId: string) {
  try {
    // Revalidate Next.js cache tags
    revalidateTag(`user-stats-${userId}`);

    // Optionally refresh the materialized view
    // Note: In production, you might want to do this asynchronously
    // or use a queue system to avoid blocking the request

    console.log(`Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error("Error invalidating user stats cache:", error);
  }
}

export async function refreshUserStatsMV(userId?: string) {
  try {
    const supabase = await import("@/lib/supabase/server").then(m =>
      m.createClerkSupabaseServerClient()
    );

    if (userId) {
      // Refresh for specific user (if we had user-specific materialized views)
      await supabase.rpc("refresh_user_stats", { user_id_param: userId });
    } else {
      // Refresh entire materialized view
      await supabase.rpc("refresh_materialized_view", {
        view_name: "user_stats_mv"
      });
    }

    console.log("Materialized view refreshed");
  } catch (error) {
    console.error("Error refreshing materialized view:", error);
  }
}

// Hook for components that need to trigger cache invalidation
export function useStatsCache() {
  return {
    invalidateUserStats: invalidateUserStatsCache,
    refreshMaterializedView: refreshUserStatsMV,
  };
}
