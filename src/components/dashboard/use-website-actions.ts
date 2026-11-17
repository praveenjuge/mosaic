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

/** What an action tells the user once the server has answered. */
type Outcome = { kind: "success" | "error" | "info"; message: string };

const regenerateOutcomes = {
  ready: { kind: "success", message: "New screenshot saved." },
  budget_exhausted: {
    kind: "error",
    message:
      "Daily screenshot limit reached. The old image keeps serving until the page's next visit refreshes it.",
  },
  rate_limited: {
    kind: "error",
    message: "Too many screenshots in a minute. Try again shortly.",
  },
  locked: {
    kind: "info",
    message: "This page is already being captured. Check back soon.",
  },
  failed: {
    kind: "error",
    message:
      "The screenshot failed. The old image stays until the page's next visit.",
  },
} satisfies Record<string, Outcome>;

export function useWebsiteActions() {
  const router = useRouter();

  /**
   * Run a server action, refresh the dashboard's data, and toast the
   * outcome. Resolves to whether it succeeded.
   */
  async function run(action: () => Promise<Outcome>): Promise<boolean> {
    try {
      const { kind, message } = await action();
      void router.invalidate();
      // `kind` is one of three literals from this file. nosemgrep
      toast[kind](message);
      return kind === "success";
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
      );
      return false;
    }
  }

  return {
    saveWebsite: ({ siteId, url }: SaveWebsiteArgs) =>
      run(async () => {
        const url_base = url.trim();
        if (!url_base) throw new Error("Please enter a valid website URL.");
        if (siteId) {
          await editSite({ data: { siteId, url_base } });
          return {
            kind: "success",
            message: "Website updated and ready to use.",
          };
        }
        await addSite({ data: { url_base } });
        return { kind: "success", message: "Website added and ready to use." };
      }),

    removeWebsite: (siteId: number) =>
      run(async () => {
        await deleteSite({ data: { siteId } });
        return { kind: "success", message: "Website deleted successfully" };
      }),

    regenerateWebsite: (siteId: number) =>
      run(async () => {
        const { deleted } = await regenerateSiteImages({ data: { siteId } });
        return {
          kind: "success",
          message: `Deleted ${deleted} ${deleted === 1 ? "image" : "images"}. Each page gets a new screenshot on its next visit.`,
        };
      }),

    regeneratePage: (pageUrl: string) =>
      run(async () => {
        const { status } = await regeneratePageImage({ data: { pageUrl } });
        return regenerateOutcomes[status];
      }),
  };
}
