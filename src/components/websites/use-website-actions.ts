import { addSite, editSite, deleteSite } from "@/server/sites";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

type SaveWebsiteArgs =
  | { siteId?: undefined; url: string }
  | { siteId: number; url: string };

export function useWebsiteActions() {
  const router = useRouter();

  async function saveWebsite(args: SaveWebsiteArgs) {
    const url = args.url.trim();

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return false;
    }

    try {
      const result =
        "siteId" in args && args.siteId
          ? await editSite({ data: { siteId: args.siteId, url_base: url } })
          : await addSite({ data: { url_base: url } });

      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      router.invalidate();
      return true;
    } catch (error) {
      console.error("Website save error:", error);
      toast.error("Failed to save website. Please try again.");
      return false;
    }
  }

  async function removeWebsite(siteId: number) {
    try {
      const result = await deleteSite({ data: { siteId } });

      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      router.invalidate();
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
