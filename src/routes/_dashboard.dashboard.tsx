import { buildSeoMeta } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

const dashboardSeo = buildSeoMeta({
  title: "Dashboard",
  description: "Manage your websites and generated Open Graph images.",
  path: "/dashboard",
});

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({
    ...dashboardSeo,
    meta: [
      ...dashboardSeo.meta,
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
