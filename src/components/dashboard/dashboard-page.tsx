import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import type { DashboardStats } from "@/lib/types";
import { DashboardLatestImages } from "./dashboard-latest-images";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardWebsitesTable } from "./dashboard-websites-table";

export default function DashboardPage({
  dashboardStats,
}: {
  dashboardStats: DashboardStats;
}) {
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
