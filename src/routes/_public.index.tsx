import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { getDashboardStats } from "@/server/stats";
import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

export const Route = createFileRoute("/_public/")({
  beforeLoad: async () => {
    const dashboardStats = await getDashboardStats();
    return { dashboardStats };
  },
  component: HomePage,
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

function HomePage() {
  const { auth, dashboardStats } = Route.useRouteContext();
  const { isSignedIn } = useAuth();

  if (auth.isAuthenticated || isSignedIn) {
    return <DashboardPage dashboardStats={dashboardStats} />;
  }

  return <HomeSignedOut />;
}
