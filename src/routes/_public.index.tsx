import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { getChangelogEntries } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import type { DashboardStats } from "@/lib/types";
import { getOgImageUrl } from "@/lib/utils";
import { getDashboardStats } from "@/server/stats";
import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

export const Route = createFileRoute("/_public/")({
  loader: async ({ context }) => {
    const changelogEntries = getChangelogEntries();
    let dashboardStats: DashboardStats | null = null;

    if (context.auth?.isAuthenticated) {
      dashboardStats = await getDashboardStats();
    }

    return { changelogEntries, dashboardStats };
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
  component: HomePage,
});

function HomePage() {
  const { changelogEntries, dashboardStats } = Route.useLoaderData();
  const { auth } = Route.useRouteContext();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // After client-side sign-in, the loader may not have fetched dashboard
  // stats yet (it ran before auth was established). Invalidate the router
  // to re-run the loader so getDashboardStats gets called with auth.
  useEffect(() => {
    if (isSignedIn && !dashboardStats) {
      router.invalidate();
    }
  }, [isSignedIn, dashboardStats, router]);

  // Use client-side Clerk state as well — after sign-in the server-side
  // auth from beforeLoad may still reflect the pre-auth state because the
  // session cookie hasn't propagated to the server function yet.
  if (auth.isAuthenticated || isSignedIn) {
    return <DashboardPage dashboardStats={dashboardStats} />;
  }

  return <HomeSignedOut changelogEntries={changelogEntries} />;
}
