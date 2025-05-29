import { createClient } from "@/lib/supabase/server";
import { PageNew, ScreenshotNew, WebsiteNew } from "@/lib/types";

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

    // Parse URL to get base and path
    const parsedUrl = new URL(pageUrl);
    const urlBase = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

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
  try {
    const parsedUrl = new URL(fullUrl);
    return {
      urlBase: `${parsedUrl.protocol}//${parsedUrl.host}`,
      path: parsedUrl.pathname + parsedUrl.search + parsedUrl.hash,
      hostname: parsedUrl.hostname,
    };
  } catch (error) {
    // Fallback for malformed URLs
    const hostname = fullUrl.replace(/^https?:\/\//, "").split("/")[0];
    return {
      urlBase: `https://${hostname}`,
      path: "/",
      hostname: hostname,
    };
  }
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
