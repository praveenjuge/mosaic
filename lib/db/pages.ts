import { createClerkSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Page } from "@/lib/types";
import { extractUrlPartsConsistent } from "@/lib/utils";

export async function getOrCreatePage(
  websiteId: string,
  path: string,
  fullUrl: string,
): Promise<Page | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: existingPage, error: selectError } = await supabase
      .from("pages")
      .select("*")
      .eq("website_id", websiteId)
      .eq("path", path)
      .single();

    if (existingPage && !selectError) {
      return existingPage;
    }

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

export async function getPagesForWebsite(
  websiteId: string,
): Promise<Array<Page> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("website_id", websiteId);

    if (error) {
      console.error("Error fetching pages for website:", error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPagesForWebsite:", error);
    return null;
  }
}

export async function deletePagesForWebsite(
  websiteId: string,
): Promise<boolean> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("website_id", websiteId);

    if (error) {
      console.error("Error deleting pages:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deletePagesForWebsite:", error);
    return false;
  }
}

export async function getOrCreatePageService(
  websiteId: string,
  path: string,
  fullUrl: string,
): Promise<Page | null> {
  try {
    const supabase = await createServiceRoleClient();
    const { data: existingPage, error: selectError } = await supabase
      .from("pages")
      .select("*")
      .eq("website_id", websiteId)
      .eq("path", path)
      .maybeSingle();
    if (existingPage && !selectError) {
      return existingPage;
    }
    const { data: newPage, error: insertError } = await supabase
      .from("pages")
      .insert({
        website_id: websiteId,
        path,
        full_url: fullUrl,
      })
      .select()
      .single();
    if (insertError) {
      console.error("Error creating page (service role):", insertError);
      return null;
    }
    return newPage;
  } catch (error) {
    console.error("Error in getOrCreatePageService:", error);
    return null;
  }
}
