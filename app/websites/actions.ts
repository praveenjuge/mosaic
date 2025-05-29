"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const handleDelete = async (websiteId: string) => {
  "use server";

  const client = await createClient();

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be logged in to delete a website.");
  }

  const { error } = await client
    .from("websites_new")
    .delete()
    .eq("id", websiteId)
    .eq("user_id", userId); // Ensure user can only delete their own websites

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/websites");
};

export const handleEdit = async (formData: FormData, websiteId: string) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const cleanedUrl = cleanUrl(url);
  const client = await createClient();

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
  const client = await createClient();

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

// Updated helper function to clean the URL
function cleanUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    // If parsing fails, attempt to extract domain using regex
    const domainMatch = url.match(
      /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/,
    );
    return domainMatch ? domainMatch[1] : url;
  }
}
