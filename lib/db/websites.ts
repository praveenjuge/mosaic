import { createClerkSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Site, SiteWithStats } from "@/lib/types";

export async function getOrCreateWebsite(
  urlBase: string,
  _siteName: string,
): Promise<Site | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: existingWebsite, error: selectError } = await supabase
      .from("sites")
      .select("*")
      .eq("url_base", urlBase)
      .single();

    if (existingWebsite && !selectError) {
      return existingWebsite;
    }

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

export async function getWebsiteWithStats(
  websiteId: string,
): Promise<{
  website: Site | null;
  total_count: number;
  total_bytes: number;
} | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data: website, error: websiteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", websiteId)
      .single();

    if (websiteError || !website) {
      console.error("[DEBUG] Error fetching website:", websiteError);
      return null;
    }

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

    const total_count = stats?.length || 0;
    const total_bytes =
      stats?.reduce((sum: number, item: { size_in_bytes?: number }) => sum + (item.size_in_bytes || 0), 0) || 0;

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

export async function getAllWebsitesWithStats(): Promise<Array<SiteWithStats> | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

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
          } as SiteWithStats;
        },
      ) || [];

    return websitesWithStats;
  } catch (error) {
    console.error("Error in getAllWebsitesWithStats:", error);
    return null;
  }
}

export async function getWebsiteForUser(
  websiteId: string,
  userId: string,
): Promise<Site | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching website for user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getWebsiteForUser:", error);
    return null;
  }
}

export async function addWebsiteForUser(
  urlBase: string,
  userId: string,
): Promise<Site | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data, error } = await supabase
      .from("sites")
      .insert({ url_base: urlBase, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Error adding website:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in addWebsiteForUser:", error);
    return null;
  }
}

export async function updateWebsiteForUser(
  websiteId: string,
  urlBase: string,
  userId: string,
): Promise<Site | null> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { data, error } = await supabase
      .from("sites")
      .update({ url_base: urlBase })
      .eq("id", websiteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating website:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in updateWebsiteForUser:", error);
    return null;
  }
}

export async function deleteWebsiteForUser(
  websiteId: string,
  userId: string,
): Promise<boolean> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", websiteId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting website:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteWebsiteForUser:", error);
    return false;
  }
}

export async function websiteExistsForUser(
  urlBase: string,
  userId: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const supabase = await createClerkSupabaseServerClient();

    let query = supabase
      .from("sites")
      .select("id")
      .eq("url_base", urlBase)
      .eq("user_id", userId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.single();

    return !!data;
  } catch (error) {
    console.error("Error in websiteExistsForUser:", error);
    return false;
  }
}

export async function websiteExists(urlBase: string): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("url_base", urlBase)
      .limit(1);
    if (error) {
      console.error("Error checking website exists:", error);
      return false;
    }
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error in websiteExists:", error);
    return false;
  }
}

export async function getRandomWebsiteByUrlBase(urlBase: string): Promise<{ id: string; user_id: string } | null> {
  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("sites")
      .select("id, user_id")
      .eq("url_base", urlBase);
    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching websites by urlBase:", error);
      return null;
    }
    return data[Math.floor(Math.random() * data.length)];
  } catch (error) {
    console.error("Error in getRandomWebsiteByUrlBase:", error);
    return null;
  }
}

export async function deleteWebsiteUsingRpc(websiteId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClerkSupabaseServerClient();
    const { error, data } = await supabase.rpc("delete_user_site", {
      site_id_param: websiteId,
      user_id_param: userId,
    });
    if (error) {
      console.error("Error calling delete_user_site:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Error in deleteWebsiteUsingRpc:", error);
    return false;
  }
}
