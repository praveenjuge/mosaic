"use server";

import { cleanUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  getWebsiteForUser,
  getPagesForWebsite,
  deleteScreenshotsForPages,
  deletePagesForWebsite,
  deleteWebsiteForUser,
  websiteExistsForUser,
  updateWebsiteForUser,
  addWebsiteForUser,
  deleteWebsiteUsingRpc,
} from "@/lib/db";

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

  console.log("Attempting to delete website:", { websiteId, userId });

  const website = await getWebsiteForUser(websiteId, userId);
  if (!website) {
    console.error("Website not found or access denied");
    return {
      status: "error",
      message: "Website not found or access denied.",
    };
  }

  console.log("Website found, proceeding with delete:", website);

  // Try using the database function first (cleaner approach)
  const functionSuccess = await deleteWebsiteUsingRpc(websiteId, userId);

  if (!functionSuccess) {
    console.log("Falling back to manual cascade delete...");

    // Fallback to manual cascade delete
    const pages = await getPagesForWebsite(websiteId);
    if (pages === null) {
      return {
        status: "error",
        message: "Error preparing to delete website.",
      };
    }

    const pageIds = pages.map((p) => p.id);
    const screenshotsDeleted = await deleteScreenshotsForPages(pageIds);
    if (!screenshotsDeleted) {
      return {
        status: "error",
        message: "Error deleting website screenshots.",
      };
    }

    const pagesDeleted = await deletePagesForWebsite(websiteId);
    if (!pagesDeleted) {
      return {
        status: "error",
        message: "Error deleting website pages.",
      };
    }

    const siteDeleted = await deleteWebsiteForUser(websiteId, userId);
    if (!siteDeleted) {
      return {
        status: "error",
        message: "Error deleting website.",
      };
    }
  }

  console.log("Website deleted successfully");
  revalidatePath("/");

  return {
    status: "success",
    message: "Website deleted successfully",
  };
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

  const exists = await websiteExistsForUser(cleanedUrl, userId, websiteId);

  if (exists) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const data = await updateWebsiteForUser(websiteId, cleanedUrl, userId);
  if (!data) {
    return { status: "error", message: "Failed to update website" };
  }

  revalidatePath("/");

  return { status: "success", message: "Website updated successfully", data };
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

  // Check if the cleaned URL already exists for this user
  const exists = await websiteExistsForUser(cleanedUrl, userId);

  if (exists) {
    return {
      status: "error",
      message: "This website already exists in your list.",
    };
  }

  const data = await addWebsiteForUser(cleanedUrl, userId);
  if (!data) {
    return { status: "error", message: "Failed to add website" };
  }

  revalidatePath("/");

  return { status: "success", message: "Website added successfully", data };
};
