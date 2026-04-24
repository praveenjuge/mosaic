import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import type { DashboardStats } from "@/lib/types";
import { useAuth } from "@clerk/tanstack-react-start";
import { DashboardLatestImages } from "./dashboard-latest-images";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardWebsitesTable } from "./dashboard-websites-table";

export default function DashboardPage({
  dashboardStats,
}: {
  dashboardStats: DashboardStats | null;
}) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return null;
  }

  if (!dashboardStats) {
    return <DashboardSkeleton />;
  }

  if (!dashboardStats.total_websites) {
    return (
      <div>
        <p style={{ padding: 20, fontFamily: "monospace" }}>
          Debug: userId = {(dashboardStats as any)._debug_userId ?? "null"}
        </p>
        <WelcomeEmptyState />
      </div>
    );
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
