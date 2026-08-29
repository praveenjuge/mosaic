import { addSite, deleteSite, editSite } from "@/server/sites";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

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

  return {
    removeWebsite,
    saveWebsite,
  };
}
