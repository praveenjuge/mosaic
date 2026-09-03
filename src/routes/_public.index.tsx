import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { getDashboardStats } from "@/server/stats";
import { createFileRoute } from "@tanstack/react-router";

const homeDescription =
  "Mosaic captures your page at 1200x630 and serves that image as the social preview. Add the URL to your og:image tag.";

export const Route = createFileRoute("/_public/")({
  beforeLoad: async () => {
    const dashboardStats = await getDashboardStats();
    return { dashboardStats };
  },
  head: () => {
    const seo = buildSeoMeta({
      title: "Simplify Your Open Graph Image Creation.",
      description: homeDescription,
      image: getOgImageUrl(""),
      path: "/",
    });

    return {
      ...seo,
    };
  },
});
