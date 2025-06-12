import { createClerkSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserStats(): Promise<{
  total_images: number;
  total_storage_bytes: number;
  total_websites: number;
} | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

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
    return {
      total_images: 0,
      total_storage_bytes: 0,
      total_websites: 0,
    };
  }
}

export async function getUserSubscriptionInfo(): Promise<{
  plan: string;
  plan_properties: {
    websites_limit: number;
    images_limit: number;
    storage_limit: string;
  };
}> {
  return {
    plan: "free",
    plan_properties: {
      websites_limit: 1,
      images_limit: 500,
      storage_limit: "50 MB",
    },
  };
}

export async function getUserUsageInfo(): Promise<{
  images_used: number;
  images_limit: number;
  websites_used: number;
  websites_limit: number;
  storage_used_bytes: number;
  storage_limit: string;
}> {
  try {
    const [userStats, subscriptionInfo] = await Promise.all([
      getUserStats(),
      getUserSubscriptionInfo(),
    ]);

    if (!userStats) {
      return {
        images_used: 0,
        images_limit: subscriptionInfo.plan_properties.images_limit,
        websites_used: 0,
        websites_limit: subscriptionInfo.plan_properties.websites_limit,
        storage_used_bytes: 0,
        storage_limit: subscriptionInfo.plan_properties.storage_limit,
      };
    }

    return {
      images_used: userStats.total_images,
      images_limit: subscriptionInfo.plan_properties.images_limit,
      websites_used: userStats.total_websites,
      websites_limit: subscriptionInfo.plan_properties.websites_limit,
      storage_used_bytes: userStats.total_storage_bytes,
      storage_limit: subscriptionInfo.plan_properties.storage_limit,
    };
  } catch (error) {
    console.error("Error in getUserUsageInfo:", error);
    return {
      images_used: 0,
      images_limit: 500,
      websites_used: 0,
      websites_limit: 1,
      storage_used_bytes: 0,
      storage_limit: "50 MB",
    };
  }
}
