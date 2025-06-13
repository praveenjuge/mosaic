import { createClerkSupabaseServerClient } from "@/lib/db/supabase/server";
import { Site, SiteWithStats } from "@/lib/types";
import { cache } from "react";

/**
 * Website/Site operations
 */

async function _getOrCreateWebsite(
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

export async function _getWebsiteWithStats(
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

async function _getAllWebsitesWithStats(): Promise<Array<SiteWithStats> | null> {
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

/**
 * Website management operations
 */

async function _addWebsite(urlBase: string, userId: string): Promise<{
  status: "success" | "error";
  message: string;
  data?: Site[];
}> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Check if the URL already exists for this user
    const { data: existingWebsite } = await supabase
      .from("sites")
      .select("id")
      .eq("url_base", urlBase)
      .eq("user_id", userId)
      .single();

    if (existingWebsite) {
      return {
        status: "error",
        message: "This website already exists in your list.",
      };
    }

    const { data, error } = await supabase
      .from("sites")
      .insert([{ url_base: urlBase, user_id: userId }])
      .select();

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success", message: "Website added successfully", data };
  } catch (error) {
    console.error("Error in addWebsite:", error);
    return { status: "error", message: "Failed to add website" };
  }
}

async function _editWebsite(websiteId: string, urlBase: string, userId: string): Promise<{
  status: "success" | "error";
  message: string;
  data?: Site[];
}> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // Check if the cleaned URL already exists for this user (excluding current website)
    const { data: existingWebsite } = await supabase
      .from("sites")
      .select("id")
      .eq("url_base", urlBase)
      .eq("user_id", userId)
      .neq("id", websiteId)
      .single();

    if (existingWebsite) {
      return {
        status: "error",
        message: "This website already exists in your list.",
      };
    }

    const { data, error } = await supabase
      .from("sites")
      .update({ url_base: urlBase })
      .eq("id", websiteId)
      .eq("user_id", userId) // Ensure user can only edit their own websites
      .select();

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success", message: "Website updated successfully", data };
  } catch (error) {
    console.error("Error in editWebsite:", error);
    return { status: "error", message: "Failed to update website" };
  }
}

async function _deleteWebsite(websiteId: string, userId: string): Promise<{
  status: "success" | "error";
  message: string;
}> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    // First check if the website exists and belongs to the user
    const { data: website, error: selectError } = await supabase
      .from("sites")
      .select("id, url_base")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .single();

    if (selectError || !website) {
      console.error("Error checking website ownership:", selectError);
      return {
        status: "error",
        message: "Website not found or access denied.",
      };
    }

    console.log("Website found, proceeding with delete:", website);

    // Try using the database function first (cleaner approach)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('delete_user_site', {
        site_id_param: websiteId,
        user_id_param: userId
      });

    if (functionError) {
      console.error("Database function error:", functionError);
      console.log("Falling back to manual cascade delete...");

      // Fallback to manual cascade delete
      // First, get all pages for this website
      const { data: pages, error: pagesError } = await supabase
        .from("pages")
        .select("id")
        .eq("website_id", websiteId);

      if (pagesError) {
        console.error("Error fetching pages:", pagesError);
        return {
          status: "error",
          message: "Error preparing to delete website.",
        };
      }

      // Delete screenshots for all pages
      if (pages && pages.length > 0) {
        const pageIds = pages.map(p => p.id);
        const { error: screenshotsDeleteError } = await supabase
          .from("screenshots")
          .delete()
          .in("page_id", pageIds);

        if (screenshotsDeleteError) {
          console.error("Error deleting screenshots:", screenshotsDeleteError);
          return {
            status: "error",
            message: "Error deleting website screenshots.",
          };
        }

        // Delete pages
        const { error: pagesDeleteError } = await supabase
          .from("pages")
          .delete()
          .eq("website_id", websiteId);

        if (pagesDeleteError) {
          console.error("Error deleting pages:", pagesDeleteError);
          return {
            status: "error",
            message: "Error deleting website pages.",
          };
        }
      }

      // Finally, delete the website
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", websiteId)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete error:", error);
        return {
          status: "error",
          message: error.message,
        };
      }
    } else if (!functionResult) {
      return {
        status: "error",
        message: "Website not found or access denied.",
      };
    }

    console.log("Website deleted successfully");
    return {
      status: "success",
      message: "Website deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteWebsite:", error);
    return { status: "error", message: "Failed to delete website" };
  }
}

async function _refreshWebsite(websiteId: string, userId: string): Promise<{
  status: "success" | "error";
  message: string;
}> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    console.log("Attempting to refresh website:", { websiteId, userId });

    // Verify that the website belongs to the authenticated user
    const { data: website, error: websiteError } = await supabase
      .from("sites")
      .select("id, url_base")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .single();

    if (websiteError || !website) {
      console.error("Website verification failed:", websiteError);
      return {
        status: "error",
        message: "Website not found or access denied.",
      };
    }

    // Get all pages for this website
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id")
      .eq("website_id", websiteId);

    if (pagesError) {
      console.error("Error fetching pages:", pagesError);
      return {
        status: "error",
        message: "Error preparing to refresh website.",
      };
    }

    if (!pages || pages.length === 0) {
      return {
        status: "success",
        message: "No pages found for this website. Visit some pages to generate OG images.",
      };
    }

    // Delete screenshots for all pages
    const pageIds = pages.map(p => p.id);
    const { error: screenshotsDeleteError } = await supabase
      .from("screenshots")
      .delete()
      .in("page_id", pageIds);

    if (screenshotsDeleteError) {
      console.error("Error deleting screenshots:", screenshotsDeleteError);
      return {
        status: "error",
        message: "Error deleting existing screenshots.",
      };
    }

    // Delete pages
    const { error: pagesDeleteError } = await supabase
      .from("pages")
      .delete()
      .eq("website_id", websiteId);

    if (pagesDeleteError) {
      console.error("Error deleting pages:", pagesDeleteError);
      return {
        status: "error",
        message: "Error deleting existing pages.",
      };
    }

    console.log(`Successfully refreshed website ${website.url_base} - deleted ${pages.length} pages and their screenshots`);

    return {
      status: "success",
      message: `Successfully refreshed ${website.url_base}. New OG images will be generated when you visit the pages again.`,
    };
  } catch (error) {
    console.error("Error in refreshWebsite:", error);
    return { status: "error", message: "Failed to refresh website" };
  }
}

async function _checkWebsiteExists(urlBase: string): Promise<boolean> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: existingWebsites, error } = await supabase
      .from("sites")
      .select("id")
      .eq("url_base", urlBase)
      .limit(1);

    if (error) {
      console.error("Error checking website exists:", error);
      return false;
    }

    return existingWebsites && existingWebsites.length > 0;
  } catch (error) {
    console.error("Error in checkWebsiteExists:", error);
    return false;
  }
}

// Cached exports
export const getOrCreateWebsite = cache(_getOrCreateWebsite);
export const getWebsiteWithStats = cache(_getWebsiteWithStats);
export const getAllWebsitesWithStats = cache(_getAllWebsitesWithStats);
export const addWebsite = cache(_addWebsite);
export const editWebsite = cache(_editWebsite);
export const deleteWebsite = cache(_deleteWebsite);
export const refreshWebsite = cache(_refreshWebsite);
export const checkWebsiteExists = cache(_checkWebsiteExists);