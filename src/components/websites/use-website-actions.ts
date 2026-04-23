"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import { toast } from "sonner";

type SaveWebsiteArgs =
  | { siteId?: undefined; url: string }
  | { siteId: string; url: string };

export function useWebsiteActions() {
  const addSite = useMutation(api.sites.addSite);
  const editSite = useMutation(api.sites.editSite);
  const deleteSite = useAction(api.sites.deleteSite);

  async function saveWebsite(args: SaveWebsiteArgs) {
    const url = args.url.trim();

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return false;
    }

    try {
      const result =
        "siteId" in args && args.siteId
          ? await editSite({ siteId: args.siteId as Id<"sites">, url_base: url })
          : await addSite({ url_base: url });

      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      return true;
    } catch (error) {
      console.error("Website save error:", error);
      toast.error("Failed to save website. Please try again.");
      return false;
    }
  }

  async function removeWebsite(siteId: string) {
    try {
      const result = await deleteSite({ siteId: siteId as Id<"sites"> });

      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      return true;
    } catch (error) {
      console.error("Website delete error:", error);
      toast.error("Failed to delete website. Please try again.");
      return false;
    }
  }

  return {
    removeWebsite,
    saveWebsite,
  };
}
