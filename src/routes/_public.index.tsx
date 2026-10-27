import HomeSignedOut from "@/components/home/homesignedout";
import { preloadableLazy } from "@/lib/preloadable-lazy";
import { buildSeoMeta } from "@/lib/seo";
import type { DashboardAnalytics } from "@/lib/site-analytics";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

// Most visitors are signed out, so their page ships with this route and
// hydrates without waiting for another chunk. The dashboard has its own
// chunk, which the loader fetches alongside the data.
const dashboardPage = preloadableLazy(
  () => import("@/components/dashboard/dashboard-page"),
);

export const Route = createFileRoute("/_public/")({
  // A loader, unlike `beforeLoad`, is cached: coming back to the dashboard
  // shows the last stats at once and refreshes them in the background.
  loader: async ({ context }) => {
    const { userId } = context.auth;
    if (!userId) {
      return { userId, dashboardStats: null, dashboardAnalytics: null };
    }
    // Signed-out visitors never call these, so their page doesn't download
    // the server function runtime.
    const { getDashboardAnalytics, getDashboardStats } =
      await import("@/server/stats");
    // Not awaited: traffic streams in after the page, so a slow Analytics
    // Engine query never holds up the dashboard.
    const dashboardAnalytics = getDashboardAnalytics().catch(
      (): DashboardAnalytics => ({ available: false }),
    );
    const [dashboardStats] = await Promise.all([
      getDashboardStats(),
      dashboardPage.preload(),
    ]);
    return { userId, dashboardStats, dashboardAnalytics };
  },
  component: HomePage,
  head: () =>
    buildSeoMeta({
      title: "Simplify Your Open Graph Image Creation.",
      description: homeDescription,
      path: "/",
    }),
});

function HomePage() {
  const { userId, dashboardStats, dashboardAnalytics } = Route.useLoaderData();
  const { auth } = Route.useRouteContext();
  // Never show cached stats to someone else after a sign-out or switch.
  const stats = userId === auth.userId ? dashboardStats : null;

  // Its own boundary, so hydrating the header doesn't wait for this chunk.
  return (
    <Suspense>
      {stats && dashboardAnalytics ? (
        <dashboardPage.Component
          // A new account gets a fresh dashboard, never the last one's
          // analytics while its own load.
          key={userId}
          dashboardStats={stats}
          dashboardAnalytics={dashboardAnalytics}
        />
      ) : (
        <HomeSignedOut />
      )}
    </Suspense>
  );
}
