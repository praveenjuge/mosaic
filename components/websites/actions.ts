"use server";

import { addWebsite, deleteWebsite, editWebsite, refreshWebsite } from "@/lib/db/sites";
import { cleanUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const handleDelete = async (websiteId: string) => {
  "use server";

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    console.error("Delete failed: No user ID");
    return {
      status: "error",
      message: "You must be logged in to delete a website.",
    };
  }

  const result = await deleteWebsite(websiteId, userId);

  if (result.status === "success") {
    revalidatePath("/");
  }

  return result;
};

export const handleEdit = async (formData: FormData, websiteId: string) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const cleanedUrl = cleanUrl(url);

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    return {
      status: "error",
      message: "You must be logged in to edit a website.",
    };
  }

  const result = await editWebsite(websiteId, cleanedUrl, userId);

  if (result.status === "success") {
    revalidatePath("/");
  }

  return result;
};

export const handleRefresh = async (websiteId: string) => {
  "use server";

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    return {
      status: "error",
      message: "You must be logged in to refresh a website.",
    };
  }

  const result = await refreshWebsite(websiteId, userId);

  if (result.status === "success") {
    revalidatePath("/");
  }

  return result;
};

export const handleAdd = async (formData: FormData) => {
  "use server";

  const url = formData.get("website")?.toString() || "";
  const cleanedUrl = cleanUrl(url);

  // Get the current user
  const { userId } = await auth();
  if (!userId) {
    return {
      status: "error",
      message: "You must be logged in to add a website.",
    };
  }

  const result = await addWebsite(cleanedUrl, userId);

  if (result.status === "success") {
    revalidatePath("/");
  }

  return result;
};
