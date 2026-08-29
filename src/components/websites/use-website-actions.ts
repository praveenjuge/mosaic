import {
  addSite,
  deleteSite,
  editSite,
  refreshSiteImages,
  verifySite,
} from "@/server/sites";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

type SaveWebsiteArgs =
  | { siteId?: undefined; url: string }
  | { siteId: number; url: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

export function useWebsiteActions() {
  const router = useRouter();

  async function saveWebsite(args: SaveWebsiteArgs) {
    const url = args.url.trim();

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return false;
    }

    try {
      if ("siteId" in args && args.siteId) {
        await editSite({ data: { siteId: args.siteId, url_base: url } });
        toast.success("Website updated. Verify the new hostname to activate it.");
      } else {
        await addSite({ data: { url_base: url } });
        toast.success("Website added. Verify ownership to activate it.");
      }

      router.invalidate();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function removeWebsite(siteId: number) {
    try {
      await deleteSite({ data: { siteId } });
      toast.success("Website deleted successfully");
      router.invalidate();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function refreshWebsite(siteId: number) {
    try {
      await refreshSiteImages({ data: { siteId } });
      toast.success(
        "Images refreshed successfully. New screenshots will generate on next visit.",
      );
      router.invalidate();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function verifyWebsite(siteId: number) {
    try {
      await verifySite({ data: { siteId } });
      toast.success("Website ownership verified");
      router.invalidate();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  return {
    removeWebsite,
    refreshWebsite,
    saveWebsite,
    verifyWebsite,
  };
}
