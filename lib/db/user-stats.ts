import { createClerkSupabaseServerClient } from "@/lib/db/supabase/server";
import { cache } from "react";

/**
 * User statistics operations
 */

async function _getUserStats(): Promise<{
  total_images: number;
  total_storage_bytes: number;
  total_websites: number;
} | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get websites count - RLS will automatically filter by authenticated user
    const { count: websitesCount, error: websitesError } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true });

    if (websitesError) {
      console.error("Error counting websites:", websitesError);
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites: 0,
      };
    }

    // Get screenshots data with proper joins - RLS will automatically filter by authenticated user
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("screenshots")
      .select(`
        id,
        size_in_bytes,
        pages!inner(
          id,
          sites!inner(
            id
          )
        )
      `);

    if (screenshotsError) {
      console.error("Error fetching screenshots for stats:", screenshotsError);
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites: websitesCount || 0,
      };
    }

    const totalImages = screenshots?.length || 0;
    const totalStorageBytes = screenshots?.reduce((sum, shot) => sum + (shot.size_in_bytes || 0), 0) || 0;

    return {
      total_images: totalImages,
      total_storage_bytes: totalStorageBytes,
      total_websites: websitesCount || 0,
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    // Return default values instead of null to prevent crashes
    return {
      total_images: 0,
      total_storage_bytes: 0,
      total_websites: 0,
    };
  }
}

// Cached exports
export const getUserStats = cache(_getUserStats);