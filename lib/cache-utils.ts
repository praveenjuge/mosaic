import { revalidateTag } from "next/cache";

/**
 * Utility functions for managing user stats cache invalidation
 */

export async function invalidateUserStatsCache(userId: string) {
  try {
    // Revalidate Next.js cache tags
    revalidateTag(`user-stats-${userId}`);

    console.log(`Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error("Error invalidating user stats cache:", error);
  }
}

// Hook for components that need to trigger cache invalidation
export function useStatsCache() {
  return {
    invalidateUserStats: invalidateUserStatsCache,
  };
}
