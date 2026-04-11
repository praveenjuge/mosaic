import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  const { changelogEntries } = Route.useLoaderData();
  const { auth } = Route.useRouteContext();

  if (auth.isAuthenticated) {
    return <DashboardPage />;
  }

  return <HomeSignedOut changelogEntries={changelogEntries} />;
}
