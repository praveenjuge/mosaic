"use server";

import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import { cleanUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const handleDelete = async (websiteId: string) => {
  "use server";

  const client = await createClerkSupabaseServerClient();

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    console.error("Delete failed: No user ID");
    return {
      status: "error",
      message: "You must be logged in to delete a website.",
    };
  }

  console.log("Attempting to delete website:", { websiteId, userId });

  // First check if the website exists and belongs to the user
  const { data: website, error: selectError } = await client
    .from("websites_new")
    .select("id, url_base")
    .eq("id", websiteId)
    .eq("user_id", userId)
    .single();

  if (selectError) {
    console.error("Error checking website ownership:", selectError);
    return {
      status: "error",
      message: "Website not found or access denied.",
    };
  }

  if (!website) {
    console.error("Website not found or access denied");
    return {
      status: "error",
      message: "Website not found or access denied.",
    };
  }

  console.log("Website found, proceeding with delete:", website);

  // Try using the database function first (cleaner approach)
  const { data: functionResult, error: functionError } = await client
    .rpc('delete_user_website', {
      website_id_param: websiteId,
      user_id_param: userId
    });

  if (functionError) {
    console.error("Database function error:", functionError);
    console.log("Falling back to manual cascade delete...");

    // Fallback to manual cascade delete
    // First, get all pages for this website
    const { data: pages, error: pagesError } = await client
      .from("pages_new")
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
      const { error: screenshotsDeleteError } = await client
        .from("screenshots_new")
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
      const { error: pagesDeleteError } = await client
        .from("pages_new")
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
    const { error } = await client
      .from("websites_new")
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
  revalidatePath("/websites");

  return {
    status: "success",
    message: "Website deleted successfully",
  };
};

export const handleEdit = async (formData: FormData, websiteId: string) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const cleanedUrl = cleanUrl(url);
  const client = await createClerkSupabaseServerClient();

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    return {
      status: "error",
      message: "You must be logged in to edit a website.",
    };
  }

  // Check if the cleaned URL already exists for this user (excluding current website)
  const { data: existingWebsite } = await client
    .from("websites_new")
    .select("id")
    .eq("url_base", cleanedUrl)
    .eq("user_id", userId)
    .neq("id", websiteId)
    .single();

  if (existingWebsite) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const { data, error } = await client
    .from("websites_new")
    .update({ url_base: cleanedUrl })
    .eq("id", websiteId)
    .eq("user_id", userId) // Ensure user can only edit their own websites
    .select();

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/websites");

  return { status: "success", message: "Website updated successfully", data };
};

export const handleAdd = async (formData: FormData) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const cleanedUrl = cleanUrl(url);
  const client = await createClerkSupabaseServerClient();

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    return {
      status: "error",
      message: "You must be logged in to add a website.",
    };
  }

  // Check if the cleaned URL already exists for this user
  const { data: existingWebsite } = await client
    .from("websites_new")
    .select("id")
    .eq("url_base", cleanedUrl)
    .eq("user_id", userId)
    .single();

  if (existingWebsite) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const { data, error } = await client
    .from("websites_new")
    .insert([{ url_base: cleanedUrl, user_id: userId }])
    .select();

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/websites");

  return { status: "success", message: "Website added successfully", data };
};
