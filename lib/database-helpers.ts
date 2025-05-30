import { createClient } from "@/lib/supabase/server";
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
 */

// Website operations
export async function getOrCreateWebsite(
  urlBase: string,
  siteName: string,
  userId: string = "public",
): Promise<WebsiteNew | null> {
  try {
    const supabase = await createClient();

    // First try to get existing website
    const { data: existingWebsite, error: selectError } = await supabase
      .from("websites_new")
      .select("*")
      .eq("url_base", urlBase)
      .eq("user_id", userId)
      .single();

    if (existingWebsite && !selectError) {
      return existingWebsite;
    }

    // Create new website if it doesn't exist
    const { data: newWebsite, error: insertError } = await supabase
      .from("websites_new")
      .insert({
        user_id: userId,
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
  userId: string,
): Promise<{
  website: WebsiteNew | null;
  total_count: number;
  total_bytes: number;
} | null> {
  try {
    console.log("[DEBUG] getWebsiteWithStats called with:", {
      websiteId,
      userId,
    });

    const supabase = await createClient();

    // Get website data
    const { data: website, error: websiteError } = await supabase
      .from("websites_new")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", userId)
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
      stats?.reduce((sum, item) => sum + (item.size_in_bytes || 0), 0) || 0;

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
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Array<ScreenshotWithDetails>;
  total: number;
} | null> {
  try {
    console.log("[DEBUG] getLatestScreenshotsForWebsite called with:", {
      websiteId,
      userId,
      page,
      limit,
    });

    const supabase = await createClient();

    // Get total count first
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
      .eq("pages_new.websites_new.id", websiteId)
      .eq("pages_new.websites_new.user_id", userId);

    if (countError) {
      console.error("[DEBUG] Error counting screenshots:", countError);
      return null;
    }

    console.log("[DEBUG] Screenshot count:", count);

    // Get paginated screenshots
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
          title,
          full_url,
          websites_new!inner(
            id,
            user_id
          )
        )
      `,
      )
      .eq("pages_new.websites_new.id", websiteId)
      .eq("pages_new.websites_new.user_id", userId)
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (screenshotsError) {
      console.error("[DEBUG] Error fetching screenshots:", screenshotsError);
      return null;
    }

    console.log("[DEBUG] Screenshots fetched:", screenshots?.length || 0);
    console.log("[DEBUG] Screenshots data:", screenshots);

    const formattedData =
      screenshots?.map(
        (screenshot: {
          id: string;
          screenshot_url: string;
          size_in_bytes?: number;
          generated_at: string;
          pages_new: { title?: string; full_url?: string }[];
        }) => ({
          id: screenshot.id,
          screenshot_url: screenshot.screenshot_url,
          size_in_bytes: screenshot.size_in_bytes || 0,
          generated_at: screenshot.generated_at,
          page_title: screenshot.pages_new?.[0]?.title || null,
          page_url: screenshot.pages_new?.[0]?.full_url || "",
        }),
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
  title?: string,
): Promise<PageNew | null> {
  try {
    const supabase = await createClient();

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
        title: title,
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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
export async function getAllWebsitesWithStats(
  userId: string,
): Promise<Array<WebsiteWithStats> | null> {
  try {
    const supabase = await createClient();

    // Get all websites with screenshot counts in a single query
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
      .eq("user_id", userId)
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
  userId: string,
  limit: number = 5,
): Promise<Array<ScreenshotWithDetails> | null> {
  try {
    const supabase = await createClient();

    // Step 1: Get user's website IDs
    const { data: userWebsites, error: websitesError } = await supabase
      .from("websites_new")
      .select("id")
      .eq("user_id", userId);

    if (websitesError) {
      console.error("Error fetching websites:", websitesError);
      return null;
    }

    if (!userWebsites || userWebsites.length === 0) {
      return [];
    }

    const websiteIds = userWebsites.map((w) => w.id);

    // Step 2: Get screenshots with page data
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
          title,
          full_url,
          website_id
        )
      `,
      )
      .order("generated_at", { ascending: false });

    if (screenshotsError) {
      console.error("Error fetching screenshots:", screenshotsError);
      return null;
    }

    if (!screenshots || screenshots.length === 0) {
      return [];
    }

    // Step 3: Filter for user's websites
    const userScreenshots = screenshots
      .filter((screenshot) => {
        const pages = screenshot.pages_new;
        const page = Array.isArray(pages) ? pages[0] : pages;
        return page && websiteIds.includes(page.website_id);
      })
      .slice(0, limit);

    if (userScreenshots.length === 0) {
      return [];
    }

    // Step 4: Get website details
    const { data: websites, error: websiteError } = await supabase
      .from("websites_new")
      .select("id, site_name, url_base")
      .in("id", websiteIds);

    if (websiteError) {
      console.error("Error fetching website details:", websiteError);
      return null;
    }

    // Step 5: Format the data
    const formattedData = userScreenshots.map((screenshot) => {
      const pages = screenshot.pages_new;
      const page = Array.isArray(pages) ? pages[0] : pages;
      const website = websites?.find((w) => w.id === page?.website_id);

      return {
        id: screenshot.id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes || 0,
        generated_at: screenshot.generated_at,
        page_title: page?.title || null,
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

// Get user statistics from new tables
export async function getUserStats(userId: string): Promise<{
  total_images: number;
  total_storage_bytes: number;
  total_websites: number;
} | null> {
  try {
    const supabase = await createClient();

    // Get all user's websites
    const { data: websites, error: websitesError } = await supabase
      .from("websites_new")
      .select("id")
      .eq("user_id", userId);

    if (websitesError) {
      console.error("Error fetching websites for stats:", websitesError);
      return null;
    }

    const total_websites = websites?.length || 0;

    if (total_websites === 0) {
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites: 0,
      };
    }

    const websiteIds = websites.map((w) => w.id);

    // Get all screenshots for user's websites
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("screenshots_new")
      .select(
        `
        id,
        size_in_bytes,
        pages_new!inner(
          id,
          website_id
        )
      `,
      )
      .in("pages_new.website_id", websiteIds);

    if (screenshotsError) {
      console.error("Error fetching screenshots for stats:", screenshotsError);
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites,
      };
    }

    const total_images = screenshots?.length || 0;
    const total_storage_bytes =
      screenshots?.reduce((sum, screenshot) => {
        return sum + (screenshot.size_in_bytes || 0);
      }, 0) || 0;

    return {
      total_images,
      total_storage_bytes,
      total_websites,
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return null;
  }
}

// Analytics functions
export async function getImagesServedAnalytics(
  userId: string,
  days: number = 30,
): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // For now, we'll simulate "served" data since we don't track actual serves
    // In the future, you might want to track this separately or via CDN logs
    const { data: screenshots, error } = await supabase
      .from("screenshots_new")
      .select(
        `
        generated_at,
        pages_new!inner(
          id,
          websites_new!inner(
            user_id
          )
        )
      `,
      )
      .eq("pages_new.websites_new.user_id", userId)
      .gte("generated_at", startDate.toISOString())
      .lte("generated_at", endDate.toISOString())
      .order("generated_at", { ascending: true });

    if (error) {
      console.error("Error fetching served analytics:", error);
      return {};
    }

    // Group by date and count
    const dailyCounts: Record<string, number> = {};

    screenshots?.forEach((screenshot) => {
      const date = new Date(screenshot.generated_at)
        .toISOString()
        .split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return dailyCounts;
  } catch (error) {
    console.error("Error in getImagesServedAnalytics:", error);
    return {};
  }
}

export async function getImagesGeneratedAnalytics(
  userId: string,
  days: number = 30,
): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data: screenshots, error } = await supabase
      .from("screenshots_new")
      .select(
        `
        generated_at,
        pages_new!inner(
          id,
          websites_new!inner(
            user_id
          )
        )
      `,
      )
      .eq("pages_new.websites_new.user_id", userId)
      .gte("generated_at", startDate.toISOString())
      .lte("generated_at", endDate.toISOString())
      .order("generated_at", { ascending: true });

    if (error) {
      console.error("Error fetching generated analytics:", error);
      return {};
    }

    // Group by date and count
    const dailyCounts: Record<string, number> = {};

    screenshots?.forEach((screenshot) => {
      const date = new Date(screenshot.generated_at)
        .toISOString()
        .split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return dailyCounts;
  } catch (error) {
    console.error("Error in getImagesGeneratedAnalytics:", error);
    return {};
  }
}

export async function getAnalyticsData(userId: string) {
  try {
    const [imagesServed, imagesGenerated] = await Promise.all([
      getImagesServedAnalytics(userId, 30),
      getImagesGeneratedAnalytics(userId, 30),
    ]);

    return {
      page_hits: imagesServed,
      website_page_analytics: imagesGenerated,
    };
  } catch (error) {
    console.error("Error in getAnalyticsData:", error);
    return {
      page_hits: {},
      website_page_analytics: {},
    };
  }
}
