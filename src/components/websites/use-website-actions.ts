import { toast } from "@/lib/toast";
import {
  addSite,
  deleteSite,
  editSite,
  regeneratePageImage,
  regenerateSiteImages,
} from "@/server/sites";
import { useRouter } from "@tanstack/react-router";

type SaveWebsiteArgs = { siteId?: number; url: string };

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
      if (args.siteId) {
        await editSite({ data: { siteId: args.siteId, url_base: url } });
        toast.success("Website updated and ready to use.");
      } else {
        await addSite({ data: { url_base: url } });
        toast.success("Website added and ready to use.");
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

  async function regenerateWebsite(siteId: number) {
    try {
      const { deleted } = await regenerateSiteImages({ data: { siteId } });
      toast.success(
        `Deleted ${deleted} ${deleted === 1 ? "image" : "images"}. Each page gets a new screenshot on its next visit.`,
      );
      router.invalidate();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function regeneratePage(pageUrl: string) {
    try {
      const result = await regeneratePageImage({ data: { pageUrl } });
      router.invalidate();
      switch (result.status) {
        case "regenerated":
          toast.success("New screenshot saved.");
          return true;
        case "budget_exhausted":
          toast.error(
            "Daily screenshot limit reached. The old image keeps serving until the page's next visit refreshes it.",
          );
          return false;
        case "rate_limited":
          toast.error("Too many screenshots in a minute. Try again shortly.");
          return false;
        case "locked":
          toast.info("This page is already being captured. Check back soon.");
          return false;
        default:
          toast.error(
            "The screenshot failed. The old image stays until the page's next visit.",
          );
          return false;
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  return {
    regeneratePage,
    regenerateWebsite,
    removeWebsite,
    saveWebsite,
  };
}
