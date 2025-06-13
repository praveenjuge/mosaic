import { createClerkSupabaseServerClient } from "@/lib/db/supabase/server";
import { Screenshot, ScreenshotWithDetails } from "@/lib/types";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { cache } from "react";

/**
 * Screenshot operations
 */

async function _createScreenshot(
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

async function _getLatestScreenshot(
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

async function _getLatestScreenshotsForWebsite(
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

async function _getLatestScreenshotsForAllUserWebsites(
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

// Cached exports
export const createScreenshot = cache(_createScreenshot);
export const getLatestScreenshot = cache(_getLatestScreenshot);
export const getLatestScreenshotsForWebsite = cache(_getLatestScreenshotsForWebsite);
export const getLatestScreenshotsForAllUserWebsites = cache(_getLatestScreenshotsForAllUserWebsites);