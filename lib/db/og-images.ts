import { createServiceRoleClient } from "@/lib/db/supabase/server";
import { extractUrlPartsConsistent } from "@/lib/utils";
import { cache } from "react";

/**
 * OG Image operations for public API
 */

/**
 * Check if an image exists in the database for a given page URL
 */
async function _checkImageInDatabase(pageUrl: string): Promise<string | null> {
  console.log(`[CACHE_CHECK_START] Checking cache for URL: ${pageUrl}`);
  try {
    const supabase = await createServiceRoleClient();
    console.log("[CACHE_CHECK_DB] Supabase client created successfully");

    const { data } = await supabase
      .from("screenshots")
      .select("screenshot_url, pages!inner(full_url)")
      .eq("pages.full_url", pageUrl)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.screenshot_url) {
      console.log(`[CACHE_CHECK_HIT] Cache hit! Found image: ${data.screenshot_url}`);
      return data.screenshot_url;
    } else {
      console.log(`[CACHE_CHECK_MISS] No cached image found for ${pageUrl}`);
      return null;
    }
  } catch (error) {
    console.error("[CACHE_CHECK_ERROR] Cache check failed:", error);
    return null;
  }
}

/**
 * Store image metadata in database
 */
async function _storeImageInDatabase(
  pageUrl: string,
  imageKey: string,
  imageSize: number,
  uploadedUrl: string
): Promise<void> {
  console.log(`[DB_STORE_START] Starting database storage for URL: ${pageUrl}`);
  try {
    const supabase = await createServiceRoleClient();
    console.log("[DB_STORE_CLIENT] Supabase client created successfully");

    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);
    console.log(`[DB_STORE_URL_PARSED] URL base: ${urlBase}, path: ${path}`);

    // Get random website for this URL base
    const { data: websitesData, error: websiteError } = await supabase
      .from("sites")
      .select("id, user_id")
      .eq("url_base", urlBase);

    if (websiteError) {
      console.error("[DB_STORE_WEBSITE_ERROR] Failed to fetch websites:", websiteError);
      return;
    }

    if (!websitesData?.length) {
      console.log(`[DB_STORE_NO_WEBSITES] No websites found for URL base: ${urlBase}`);
      return;
    }

    const website = websitesData[Math.floor(Math.random() * websitesData.length)];
    console.log(`[DB_STORE_WEBSITE_SELECTED] Selected website: ${website.id}, user: ${website.user_id} (${websitesData.length} total websites)`);

    // Get or create page
    const { data: pageData, error: pageSelectError } = await supabase
      .from("pages")
      .select("id")
      .eq("website_id", website.id)
      .eq("path", path)
      .maybeSingle();

    let page = pageData;

    if (pageSelectError) {
      console.error("[DB_STORE_PAGE_SELECT_ERROR] Failed to check existing page:", pageSelectError);
      return;
    }

    if (!page) {
      console.log(`[DB_STORE_PAGE_CREATE] Creating new page for path: ${path}`);
      const { data: newPage, error: pageCreateError } = await supabase
        .from("pages")
        .insert({
          website_id: website.id,
          user_id: website.user_id,
          path,
          full_url: pageUrl,
        })
        .select("id")
        .single();

      if (pageCreateError) {
        console.error("[DB_STORE_PAGE_CREATE_ERROR] Failed to create new page:", pageCreateError);
        return;
      }
      page = newPage;
      console.log(`[DB_STORE_PAGE_CREATED] Created new page with ID: ${page?.id}`);
    } else {
      console.log(`[DB_STORE_PAGE_EXISTS] Using existing page with ID: ${page.id}`);
    }

    if (page) {
      console.log(`[DB_STORE_SCREENSHOT_START] Storing screenshot for page ID: ${page.id}`);
      const { error: screenshotError } = await supabase.from("screenshots").insert({
        page_id: page.id,
        screenshot_url: uploadedUrl,
        image_hash: imageKey,
        size_in_bytes: imageSize,
        user_id: website.user_id,
      });

      if (screenshotError) {
        console.error("[DB_STORE_SCREENSHOT_ERROR] Failed to store screenshot:", screenshotError);
        return;
      }
      console.log(`[DB_STORE_SUCCESS] Successfully stored screenshot for page ${page.id}`);
    } else {
      console.error("[DB_STORE_NO_PAGE] No page available for screenshot storage");
    }
  } catch (error) {
    console.error("[DB_STORE_ERROR] Database storage error:", error);
  }
}

/**
 * Check if a website exists by URL base (for public API validation)
 */
async function _checkWebsiteExistsForUrl(urlBase: string): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();

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
    console.error("Error in checkWebsiteExistsForUrl:", error);
    return false;
  }
}

// Cached exports
export const checkImageInDatabase = cache(_checkImageInDatabase);
export const storeImageInDatabase = cache(_storeImageInDatabase);
export const checkWebsiteExistsForUrl = cache(_checkWebsiteExistsForUrl);
