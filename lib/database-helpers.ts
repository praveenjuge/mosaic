import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import {
  Page,
  Screenshot,
  ScreenshotWithDetails,
  Site,
  SiteWithStats,
  UserSubscriptionInfo,
} from "@/lib/types";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";

/**
 * Helper functions for working with the new database structure
 * Using Clerk-integrated Supabase client for RLS authentication
 */

// Website operations
export async function getOrCreateWebsite(
  urlBase: string,
): Promise<Site | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // First try to get existing website
    // RLS policy will automatically filter by authenticated user
    const { data: existingWebsite, error: selectError } = await supabase
      .from("sites")
      .select("*")
      .eq("url_base", urlBase)
      .single();

    if (existingWebsite && !selectError) {
      return existingWebsite;
    }

    // Create new website if it doesn't exist
    // RLS policy will automatically set user_id to authenticated user
    const { data: newWebsite, error: insertError } = await supabase
      .from("sites")
      .insert({
        url_base: urlBase,
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
  website: Site | null;
  total_count: number;
  total_bytes: number;
} | null> {
  try {
    console.log("[DEBUG] getWebsiteWithStats called with:", { websiteId });

    const supabase = await createClerkSupabaseServerClient();

    // Get website data - RLS will automatically filter by authenticated user
    const { data: website, error: websiteError } = await supabase
      .from("sites")
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
      .from("screenshots")
      .select(
        `
        id,
        size_in_bytes,
        pages!inner(
          id,
          sites!inner(
            id
          )
        )
      `,
      )
      .eq("pages.sites.id", websiteId);

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
      .from("screenshots")
      .select(
        `
        id,
        pages!inner(
          id,
          sites!inner(
            id
          )
        )
      `,
        { count: "exact", head: true },
      )
      .eq("pages.sites.id", websiteId);

    if (countError) {
      console.error("Error counting screenshots:", countError);
      return null;
    }

    // Get paginated screenshots - RLS will automatically filter by user
    const offset = (page - 1) * limit;
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("screenshots")
      .select(
        `
        id,
        screenshot_url,
        size_in_bytes,
        generated_at,
        pages!inner(
          full_url,
          sites!inner(
            id,
            user_id
          )
        )
      `,
      )
      .eq("pages.sites.id", websiteId)
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
          pages: Array<{ full_url?: string }>;
        }) => {
          // pages is an array due to join, so take the first element
          const page = Array.isArray(screenshot.pages)
            ? screenshot.pages[0]
            : screenshot.pages;

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
): Promise<Page | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // First try to get existing page
    const { data: existingPage, error: selectError } = await supabase
      .from("pages")
      .select("*")
      .eq("website_id", websiteId)
      .eq("path", path)
      .single();

    if (existingPage && !selectError) {
      return existingPage;
    }

    // Create new page if it doesn't exist
    const { data: newPage, error: insertError } = await supabase
      .from("pages")
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
): Promise<Screenshot | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: newScreenshot, error } = await supabase
      .from("screenshots")
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
      .from("screenshots")
      .select(
        `
        screenshot_url,
        pages!inner(
          full_url,
          sites!inner(
            url_base
          )
        )
      `,
      )
      .eq("pages.sites.url_base", urlBase)
      .eq("pages.path", path)
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
export async function getAllWebsitesWithStats(): Promise<Array<SiteWithStats> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Get all websites with screenshot counts in a single query
    // RLS will automatically filter by authenticated user
    const { data: websites, error } = await supabase
      .from("sites")
      .select(
        `
        *,
        pages(
          id,
          screenshots(
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
          website: Site & {
            pages: Array<{
              id: string;
              screenshots: Array<{ id: string }>;
            }>;
          },
        ) => {
          const screenshot_count =
            website.pages?.reduce(
              (
                total: number,
                page: { screenshots: Array<{ id: string }> },
              ) => {
                return total + (page.screenshots?.length || 0);
              },
              0,
            ) || 0;

          return {
            id: website.id,
            user_id: website.user_id,
            url_base: website.url_base,
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
      .from("screenshots")
      .select(
        `
        id,
        screenshot_url,
        size_in_bytes,
        generated_at,
        pages (
          id,
          full_url,
          website_id,
          sites (
            id,
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
      // Since we're using regular joins (not !inner), pages should be a single object
      const page = screenshot.pages;
      const website = page?.sites;

      return {
        id: screenshot.id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes || 0,
        generated_at: screenshot.generated_at,
        page_title: null,
        page_url: page?.full_url || "",
        website_name: website?.url_base || "Unknown",
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

// Polar API helper function
async function getPolarCustomerState(userId: string): Promise<any> {
  try {
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;

    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN not configured");
      return null;
    }

    const polar = new Polar({
      accessToken: polarAccessToken,
      server: process.env.NODE_ENV === 'development' ? "sandbox" : "production",
    });

    const response = await polar.customers.getStateExternal({
      externalId: userId,
    });

    return response || null;
  } catch (error: any) {
    // Handle 404 as customer not found (normal case)
    if (error?.statusCode === 404 || error?.status === 404) {
      return null;
    }

    console.error("Error fetching Polar customer state:", error);
    return null;
  }
}

// User subscription and limits helper functions
export async function getUserSubscriptionInfo(): Promise<UserSubscriptionInfo> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    const customerState = await getPolarCustomerState(userId);

    if (!customerState || !customerState.activeSubscriptions?.length) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    // Find active subscription
    const activeSubscription = customerState.activeSubscriptions?.find(
      (sub: any) => sub.status === "active" && !sub.cancelAtPeriodEnd
    );

    if (!activeSubscription) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    // Determine plan type based on product ID and interval
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const proYearlyProductId = process.env.POLAR_PRO_YEARLY_PRODUCT_ID;

    let planType = "pro";
    let planProperties;

    if (activeSubscription.productId === proYearlyProductId) {
      planType = "pro-yearly";
      planProperties = {
        websites_limit: 999999, // Unlimited for pro yearly
        images_limit: 999999,   // Unlimited for pro yearly
      };
    } else {
      planProperties = {
        websites_limit: 999999, // Unlimited for pro monthly
        images_limit: 5000,     // 5000 for pro monthly
      };
    }

    return {
      plan: planType,
      plan_properties: planProperties,
      is_active: true,
      subscription_details: activeSubscription,
    };
  } catch (error) {
    console.error("Error in getUserSubscriptionInfo:", error);
    // Return safe defaults
    return {
      plan: "free",
      plan_properties: {
        websites_limit: 1,
        images_limit: 500,
      },
      is_active: false,
    };
  }
}
