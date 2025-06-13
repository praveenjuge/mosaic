import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
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

// Cached exports
export const getOrCreateWebsite = cache(_getOrCreateWebsite);
export const getWebsiteWithStats = cache(_getWebsiteWithStats);
export const getAllWebsitesWithStats = cache(_getAllWebsitesWithStats);