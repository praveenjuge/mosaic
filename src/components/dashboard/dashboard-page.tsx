import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "convex/react";
import { DashboardLatestImages } from "./dashboard-latest-images";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardWebsitesTable } from "./dashboard-websites-table";

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const dashboardStats = useQuery(api.stats.getUserDashboardStats);

  if (!isSignedIn) {
    return null;
  }

  if (dashboardStats === undefined) {
    return <DashboardSkeleton />;
  }

  if (!dashboardStats.total_websites) {
    return <WelcomeEmptyState />;
  }

  return (
    <div className="flex flex-col gap-10">
      <DashboardOverview dashboardStats={dashboardStats} />
      <DashboardWebsitesTable dashboardStats={dashboardStats} />
      <DashboardLatestImages
        latestScreenshots={dashboardStats.latest_screenshots}
      />
    </div>
  );
}
