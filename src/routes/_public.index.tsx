import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { getDashboardStats } from "@/server/stats";
import { createFileRoute } from "@tanstack/react-router";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

export const Route = createFileRoute("/_public/")({
  beforeLoad: async ({ context }) => ({
    dashboardStats: context.auth.isAuthenticated
      ? await getDashboardStats()
      : null,
  }),
  component: HomePage,
  head: () =>
    buildSeoMeta({
      title: "Simplify Your Open Graph Image Creation.",
      description: homeDescription,
      image: getOgImageUrl(""),
      path: "/",
    }),
});

function HomePage() {
  const { dashboardStats } = Route.useRouteContext();

  return dashboardStats ? (
    <DashboardPage dashboardStats={dashboardStats} />
  ) : (
    <HomeSignedOut />
  );
}
