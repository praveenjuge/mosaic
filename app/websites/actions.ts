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
  const client = await createClient();
  const { data, error } = await client
    .from("websites")
    .update({ website_url: url })
    .eq("id", websiteId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/websites");

  return data;
};

export const handleAdd = async (formData: FormData) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const client = await createClient();
  const { data, error } = await client
    .from("websites")
    .insert([{ website_url: url }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/websites");

  return data;
};
