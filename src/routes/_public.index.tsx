import { preloadableLazy } from "@/lib/preloadable-lazy";
import { buildSeoMeta } from "@/lib/seo";
import { getDashboardStats } from "@/server/stats";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

// Signed-in and signed-out visitors see different pages, so each downloads
// only its own. The loader fetches the chunk alongside the data.
const dashboardPage = preloadableLazy(
  () => import("@/components/dashboard/dashboard-page"),
);
const homeSignedOut = preloadableLazy(
  () => import("@/components/home/homesignedout"),
);

export const Route = createFileRoute("/_public/")({
  // A loader, unlike `beforeLoad`, is cached: coming back to the dashboard
  // shows the last stats at once and refreshes them in the background.
  loader: async ({ context }) => {
    const { userId } = context.auth;
    if (!userId) {
      await homeSignedOut.preload();
      return { userId, dashboardStats: null };
    }
    const [dashboardStats] = await Promise.all([
      getDashboardStats(),
      dashboardPage.preload(),
    ]);
    return { userId, dashboardStats };
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
  const { userId, dashboardStats } = Route.useLoaderData();
  const { auth } = Route.useRouteContext();
  // Never show cached stats to someone else after a sign-out or switch.
  const stats = userId === auth.userId ? dashboardStats : null;

  // Its own boundary, so hydrating the header doesn't wait for this chunk.
  return (
    <Suspense>
      {stats ? (
        <dashboardPage.Component dashboardStats={stats} />
      ) : (
        <homeSignedOut.Component />
      )}
    </Suspense>
  );
}
