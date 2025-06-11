import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import {
  PageNew,
  ScreenshotNew,
  ScreenshotWithDetails,
  WebsiteNew,
  WebsiteWithStats,
} from "@/lib/types";
import { extractUrlPartsConsistent } from "@/lib/utils";

/**
 * Helper functions for working with the new database structure
 * Using Clerk-integrated Supabase client for RLS authentication
 */

// Website operations
export async function getOrCreateWebsite(
  urlBase: string,
  siteName: string,
): Promise<WebsiteNew | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // First try to get existing website
    // RLS policy will automatically filter by authenticated user
    const { data: existingWebsite, error: selectError } = await supabase
      .from("websites_new")
      .select("*")
      .eq("url_base", urlBase)
      .single();

    if (existingWebsite && !selectError) {
      return existingWebsite;
    }

    // Create new website if it doesn't exist
    // RLS policy will automatically set user_id to authenticated user
    const { data: newWebsite, error: insertError } = await supabase
      .from("websites_new")
      .insert({
        url_base: urlBase,
        site_name: siteName,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating website:", insertError);
      return null;
    }

    return newWebsite;
  } catch (error) {
    console.error("Error in getOrCreateWebsite:", error);
    return null;
  }
}

// Get website with statistics
export async function getWebsiteWithStats(
  websiteId: string,
): Promise<{
  website: WebsiteNew | null;
  total_count: number;
  total_bytes: number;
} | null> {
  try {
    console.log("[DEBUG] getWebsiteWithStats called with:", { websiteId });

    const supabase = await createClerkSupabaseServerClient();

    // Get website data - RLS will automatically filter by authenticated user
    const { data: website, error: websiteError } = await supabase
      .from("websites_new")
      .select("*")
      .eq("id", websiteId)
      .single();

    if (websiteError || !website) {
      console.error("[DEBUG] Error fetching website:", websiteError);
      return null;
    }

    console.log("[DEBUG] Website found:", website);

    // Get statistics - count of screenshots and total size
    const { data: stats, error: statsError } = await supabase
      .from("screenshots_new")
      .select(
        `
        id,
        size_in_bytes,
        pages_new!inner(
          id,
          websites_new!inner(
            id
          )
        )
      `,
      )
      .eq("pages_new.websites_new.id", websiteId);

    if (statsError) {
      console.error("[DEBUG] Error fetching stats:", statsError);
      return {
        website,
        total_count: 0,
        total_bytes: 0,
      };
    }

    console.log("[DEBUG] Stats query result:", stats);

    const total_count = stats?.length || 0;
    const total_bytes =
      stats?.reduce((sum: number, item: { size_in_bytes?: number }) => sum + (item.size_in_bytes || 0), 0) || 0;

    console.log("[DEBUG] Calculated stats:", { total_count, total_bytes });

    return {
      website,
      total_count,
      total_bytes,
    };
  } catch (error) {
    console.error("Error in getWebsiteWithStats:", error);
    return null;
  }
}

// Get latest screenshots for a website
export async function getLatestScreenshotsForWebsite(
  websiteId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Array<ScreenshotWithDetails>;
  total: number;
} | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get total count first - RLS will automatically filter by user
    const { count, error: countError } = await supabase
      .from("screenshots_new")
      .select(
        `
        id,
        pages_new!inner(
          id,
          websites_new!inner(
            id
          )
        )
      `,
        { count: "exact", head: true },
      )
      .eq("pages_new.websites_new.id", websiteId);

    if (countError) {
      console.error("Error counting screenshots:", countError);
      return null;
    }

    // Get paginated screenshots - RLS will automatically filter by user
    const offset = (page - 1) * limit;
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("screenshots_new")
      .select(
        `
        id,
        screenshot_url,
        size_in_bytes,
        generated_at,
        pages_new!inner(
          full_url,
          websites_new!inner(
            id,
            user_id
          )
        )
      `,
      )
      .eq("pages_new.websites_new.id", websiteId)
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (screenshotsError) {
      console.error("Error fetching screenshots:", screenshotsError);
      return null;
    }

    const formattedData =
      screenshots?.map(
        (screenshot: {
          id: string;
          screenshot_url: string;
          size_in_bytes?: number;
          generated_at: string;
          pages_new: Array<{ full_url?: string }>;
        }) => {
          // pages_new is an array due to join, so take the first element
          const page = Array.isArray(screenshot.pages_new)
            ? screenshot.pages_new[0]
            : screenshot.pages_new;

          return {
            id: screenshot.id,
            screenshot_url: screenshot.screenshot_url,
            size_in_bytes: screenshot.size_in_bytes || 0,
            generated_at: screenshot.generated_at,
            page_title: null,
            page_url: page?.full_url || "",
          };
        }
      ) || [];

    return {
      data: formattedData,
      total: count || 0,
    };
  } catch (error) {
    console.error("Error in getLatestScreenshotsForWebsite:", error);
    return null;
  }
}

// Page operations
export async function getOrCreatePage(
  websiteId: string,
  path: string,
  fullUrl: string,
): Promise<PageNew | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // First try to get existing page
    const { data: existingPage, error: selectError } = await supabase
      .from("pages_new")
      .select("*")
      .eq("website_id", websiteId)
      .eq("path", path)
      .single();

    if (existingPage && !selectError) {
      return existingPage;
    }

    // Create new page if it doesn't exist
    const { data: newPage, error: insertError } = await supabase
      .from("pages_new")
      .insert({
        website_id: websiteId,
        path: path,
        full_url: fullUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating page:", insertError);
      return null;
    }

    return newPage;
  } catch (error) {
    console.error("Error in getOrCreatePage:", error);
    return null;
  }
}

// Screenshot operations
export async function createScreenshot(
  pageId: string,
  screenshotUrl: string,
  imageHash?: string,
  sizeInBytes?: number,
): Promise<ScreenshotNew | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: newScreenshot, error } = await supabase
      .from("screenshots_new")
      .insert({
        page_id: pageId,
        screenshot_url: screenshotUrl,
        image_hash: imageHash,
        size_in_bytes: sizeInBytes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating screenshot:", error);
      return null;
    }

    return newScreenshot;
  } catch (error) {
    console.error("Error in createScreenshot:", error);
    return null;
  }
}

export async function getLatestScreenshot(
  pageUrl: string,
): Promise<string | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Parse URL to get base and path using consistent parsing
    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);

    // Query the new table structure
    const { data, error } = await supabase
      .from("screenshots_new")
      .select(
        `
        screenshot_url,
        pages_new!inner(
          full_url,
          websites_new!inner(
            url_base
          )
        )
      `,
      )
      .eq("pages_new.websites_new.url_base", urlBase)
      .eq("pages_new.path", path)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.screenshot_url;
  } catch (error) {
    console.error("Error getting latest screenshot:", error);
    return null;
  }
}

// Utility functions
export function extractUrlParts(fullUrl: string): {
  urlBase: string;
  path: string;
  hostname: string;
} {
  return extractUrlPartsConsistent(fullUrl);
}

export function extractTitleFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    if (pathname === "/" || pathname === "") {
      return parsedUrl.hostname;
    }

    // Convert path to title (remove slashes, capitalize)
    return pathname
      .split("/")
      .filter((segment) => segment)
      .join(" ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  } catch {
    return url;
  }
}

// Get all websites for a user with screenshot counts
export async function getAllWebsitesWithStats(): Promise<Array<WebsiteWithStats> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get all websites with screenshot counts in a single query
    // RLS will automatically filter by authenticated user
    const { data: websites, error } = await supabase
      .from("websites_new")
      .select(
        `
        *,
        pages_new(
          id,
          screenshots_new(
            id
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching websites with stats:", error);
      return null;
    }

    // Transform the data to include screenshot counts
    const websitesWithStats =
      websites?.map(
        (
          website: WebsiteNew & {
            pages_new: Array<{
              id: string;
              screenshots_new: Array<{ id: string }>;
            }>;
          },
        ) => {
          const screenshot_count =
            website.pages_new?.reduce(
              (
                total: number,
                page: { screenshots_new: Array<{ id: string }> },
              ) => {
                return total + (page.screenshots_new?.length || 0);
              },
              0,
            ) || 0;

          return {
            id: website.id,
            user_id: website.user_id,
            url_base: website.url_base,
            site_name: website.site_name,
            created_at: website.created_at,
            updated_at: website.updated_at,
            screenshot_count,
          };
        },
      ) || [];

    return websitesWithStats;
  } catch (error) {
    console.error("Error in getAllWebsitesWithStats:", error);
    return null;
  }
}

// Get latest screenshots for all user's websites
export async function getLatestScreenshotsForAllUserWebsites(
  limit: number = 10,
): Promise<Array<ScreenshotWithDetails> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get screenshots with page data - RLS will automatically filter by user
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("screenshots_new")
      .select(
        `
        id,
        screenshot_url,
        size_in_bytes,
        generated_at,
        pages_new (
          id,
          full_url,
          website_id,
          websites_new (
            id,
            site_name,
            url_base
          )
        )
      `,
      )
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (screenshotsError) {
      console.error("Error fetching screenshots:", screenshotsError);
      return null;
    }

    if (!screenshots || screenshots.length === 0) {
      return [];
    }

    // Format the data - handle the nested structure from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedData = screenshots.map((screenshot: any) => {
      // Since we're using regular joins (not !inner), pages_new should be a single object
      const page = screenshot.pages_new;
      const website = page?.websites_new;

      return {
        id: screenshot.id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes || 0,
        generated_at: screenshot.generated_at,
        page_title: null,
        page_url: page?.full_url || "",
        website_name: website?.site_name || website?.url_base || "Unknown",
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error in getLatestScreenshotsForAllUserWebsites:", error);
    return null;
  }
}

// Get user statistics from new tables - simplified direct query version
export async function getUserStats(): Promise<{
  total_images: number;
  total_storage_bytes: number;
  total_websites: number;
} | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get websites count - RLS will automatically filter by authenticated user
    const { count: websitesCount, error: websitesError } = await supabase
      .from("websites_new")
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
      .from("screenshots_new")
      .select(`
        id,
        size_in_bytes,
        pages_new!inner(
          id,
          websites_new!inner(
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

// User subscription and limits helper functions - simplified for free plan only
export async function getUserSubscriptionInfo(): Promise<{
  plan: string;
  plan_properties: {
    websites_limit: number;
    images_limit: number;
    storage_limit: string;
  };
}> {
  // For now, all users are on free plan
  return {
    plan: "free",
    plan_properties: {
      websites_limit: 1,
      images_limit: 500,
      storage_limit: "50 MB",
    },
  };
}

// Get current usage vs limits for a user
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
    // Return safe defaults
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
