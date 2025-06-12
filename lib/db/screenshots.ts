import { createClerkSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getRandomWebsiteByUrlBase } from "./websites";
import { getOrCreatePageService } from "./pages";
import {
  Screenshot,
  ScreenshotWithDetails,
  ScreenshotWithPage,
} from "@/lib/types";
import { extractUrlPartsConsistent } from "@/lib/utils";

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

    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);

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
          } as ScreenshotWithDetails;
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

export async function getLatestScreenshotsForAllUserWebsites(
  limit: number = 10,
): Promise<Array<ScreenshotWithDetails> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

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

    const formattedData = screenshots.map((screenshot: ScreenshotWithPage) => {
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
      } as ScreenshotWithDetails;
    });

    return formattedData;
  } catch (error) {
    console.error("Error in getLatestScreenshotsForAllUserWebsites:", error);
    return null;
  }
}

export async function deleteScreenshotsForPages(
  pageIds: string[],
): Promise<boolean> {
  if (pageIds.length === 0) return true;
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { error } = await supabase
      .from("screenshots")
      .delete()
      .in("page_id", pageIds);

    if (error) {
      console.error("Error deleting screenshots:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteScreenshotsForPages:", error);
    return false;
  }
}

export async function createScreenshotService(
  pageId: string,
  screenshotUrl: string,
  userId: string,
  imageHash?: string,
  sizeInBytes?: number,
): Promise<Screenshot | null> {
  try {
    const supabase = await createServiceRoleClient();
    const { data: newScreenshot, error } = await supabase
      .from("screenshots")
      .insert({
        page_id: pageId,
        screenshot_url: screenshotUrl,
        image_hash: imageHash,
        size_in_bytes: sizeInBytes,
        user_id: userId,
      })
      .select()
      .single();
    if (error) {
      console.error("Error creating screenshot (service role):", error);
      return null;
    }
    return newScreenshot;
  } catch (error) {
    console.error("Error in createScreenshotService:", error);
    return null;
  }
}

export async function storeScreenshotForUrl(
  pageUrl: string,
  imageKey: string,
  imageSize: number,
  uploadedUrl: string,
): Promise<void> {
  try {
    const { urlBase, path } = extractUrlPartsConsistent(pageUrl);
    const website = await getRandomWebsiteByUrlBase(urlBase);
    if (!website) {
      console.log(`[DB_STORE_NO_WEBSITE] No websites found for ${urlBase}`);
      return;
    }
    const page = await getOrCreatePageService(website.id, path, pageUrl);
    if (!page) {
      console.error("[DB_STORE_PAGE_FAIL] Could not create or fetch page");
      return;
    }
    await createScreenshotService(page.id, uploadedUrl, website.user_id, imageKey, imageSize);
  } catch (error) {
    console.error("Error in storeScreenshotForUrl:", error);
  }
}
