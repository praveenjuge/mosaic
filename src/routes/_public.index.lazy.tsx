import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { useAuth } from "@clerk/tanstack-react-start";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  const { auth, dashboardStats } = Route.useRouteContext();
  const { isSignedIn } = useAuth();

  if (auth.isAuthenticated || isSignedIn) {
    return <DashboardPage dashboardStats={dashboardStats} />;
  }

  return <HomeSignedOut />;
}
