import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

const helpDescription =
  "Find solutions to common issues and get help with troubleshooting.";

export const Route = createFileRoute("/_public/help")({
  head: () =>
    buildSeoMeta({
      title: "Help & Support",
      description: helpDescription,
      image: getOgImageUrl("help"),
      path: "/help",
    }),
});
