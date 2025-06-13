import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import { Page } from "@/lib/types";
import { cache } from "react";

/**
 * Page operations
 */

async function _getOrCreatePage(
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

// Cached exports
export const getOrCreatePage = cache(_getOrCreatePage);