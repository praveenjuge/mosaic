import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/legal")({
  head: () =>
    buildSeoMeta({
      title: "Legal Information",
      description: "We take your privacy and data seriously.",
      image: getOgImageUrl("legal"),
      path: "/legal",
    }),
});
