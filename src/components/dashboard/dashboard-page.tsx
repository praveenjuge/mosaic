import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import { Toaster } from "@/components/ui/sonner";
import type { DashboardStats } from "@/lib/types";
import { DashboardLatestImages } from "./dashboard-latest-images";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardWebsitesTable } from "./dashboard-websites-table";

export default function DashboardPage({
  dashboardStats,
}: {
  dashboardStats: DashboardStats;
}) {
  // Only the dashboard shows toasts, so other pages don't download sonner.
  // The Toaster stays mounted when the first website replaces the welcome.
  return (
    <>
      <Toaster richColors />
      {dashboardStats.total_websites ? (
        <div className="flex flex-col gap-10">
          <DashboardOverview dashboardStats={dashboardStats} />
          <DashboardWebsitesTable dashboardStats={dashboardStats} />
          <DashboardLatestImages
            latestScreenshots={dashboardStats.latest_screenshots}
          />
        </div>
      ) : (
        <WelcomeEmptyState />
      )}
    </>
  );
}
