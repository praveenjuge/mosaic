import { getGuideLinks, getHelpCategories } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

const helpDescription =
  "Find solutions to common issues and get help with troubleshooting.";

export const Route = createFileRoute("/_public/help")({
  loader: () => ({
    guides: getGuideLinks(),
    helpCategories: getHelpCategories(),
  }),
  head: ({ match, matches }) => {
    const isExactHelpRoute = matches.at(-1)?.routeId === match.routeId;

    if (!isExactHelpRoute) {
      return {};
    }

    return buildSeoMeta({
      title: "Help & Support",
      description: helpDescription,
      image: getOgImageUrl("help"),
      path: "/help",
    });
  },
});
