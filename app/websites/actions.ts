"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const handleDelete = async (websiteId: string) => {
  "use server";

  const client = await createClient();
  const { error } = await client.from("websites").delete().eq("id", websiteId);

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

  // Check if the cleaned URL already exists
  const { data: existingWebsite } = await client
    .from("websites")
    .select("id")
    .eq("cleaned_website_url", cleanedUrl)
    .neq("id", websiteId)
    .single();

  if (existingWebsite) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const { data, error } = await client
    .from("websites")
    .update({ website_url: url, cleaned_website_url: cleanedUrl })
    .eq("id", websiteId)
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

  // Check if the cleaned URL already exists
  const { data: existingWebsite } = await client
    .from("websites")
    .select("id")
    .eq("cleaned_website_url", cleanedUrl)
    .single();

  if (existingWebsite) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const { data, error } = await client
    .from("websites")
    .insert([{ website_url: url, cleaned_website_url: cleanedUrl }])
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
