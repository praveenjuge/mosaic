import { getLegalDocuments } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/legal")({
  loader: () => ({
    legalDocuments: getLegalDocuments(),
  }),
  head: () =>
    buildSeoMeta({
      title: "Legal Information",
      description: "We take your privacy and data seriously.",
      image: getOgImageUrl("legal"),
      path: "/legal",
    }),
});
