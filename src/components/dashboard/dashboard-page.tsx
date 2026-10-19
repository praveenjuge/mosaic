import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import { Toaster } from "@/components/ui/sonner";
import type { DashboardAnalytics } from "@/lib/site-analytics";
import type { DashboardStats } from "@/lib/types";
import { Await } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLatestImages } from "./dashboard-latest-images";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardTopPages, DashboardTraffic } from "./dashboard-traffic";
import { DashboardUsage } from "./dashboard-usage";
import { DashboardWebsitesTable } from "./dashboard-websites-table";

function Dashboard({
  dashboardStats,
  analytics,
}: {
  dashboardStats: DashboardStats;
  /** `null` while the analytics query streams in. */
  analytics: DashboardAnalytics | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your websites and the link previews Mosaic serves for them.
        </p>
      </header>
      <DashboardOverview
        dashboardStats={dashboardStats}
        analytics={analytics}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardTraffic analytics={analytics} className="lg:col-span-2" />
        <DashboardUsage budget={dashboardStats.budget} />
      </div>
      <DashboardWebsitesTable
        dashboardStats={dashboardStats}
        analytics={analytics}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardLatestImages
          latestScreenshots={dashboardStats.latest_screenshots}
          className="lg:col-span-2"
        />
        <DashboardTopPages analytics={analytics} />
      </div>
    </div>
  );
}

/** The saved hostnames, which decide what the analytics cover. */
function websitesKey(stats: DashboardStats): string {
  return stats.websites
    .map(({ url_base }) => url_base)
    .sort()
    .join(" ");
}

type RetainedAnalytics = { key: string; analytics: DashboardAnalytics };

/** Hands each resolved analytics result, with the websites it covers, up. */
function ReportAnalytics({
  analytics,
  websites,
  onResolve,
}: {
  analytics: DashboardAnalytics;
  websites: string;
  onResolve: (retained: RetainedAnalytics) => void;
}) {
  useEffect(() => {
    onResolve({ key: websites, analytics });
  }, [analytics, websites, onResolve]);
  return null;
}

export default function DashboardPage({
  dashboardStats,
  dashboardAnalytics,
}: {
  dashboardStats: DashboardStats;
  dashboardAnalytics: Promise<DashboardAnalytics>;
}) {
  // The dashboard renders once, outside the analytics' Suspense boundary:
  // an action reloads the route and its analytics, and rendering it as the
  // boundary's fallback and content would remount it, closing open dialogs.
  // Until new numbers arrive, it keeps showing the last ones, but only while
  // they cover the same websites.
  const [retained, setRetained] = useState<RetainedAnalytics | null>(null);
  const websites = websitesKey(dashboardStats);
  const analytics = retained?.key === websites ? retained.analytics : null;

  // Only the dashboard shows toasts, so other pages don't download sonner.
  // The Toaster stays mounted when the first website replaces the welcome.
  return (
    <>
      <Toaster richColors />
      {dashboardStats.total_websites ? (
        <>
          <Dashboard dashboardStats={dashboardStats} analytics={analytics} />
          <Await promise={dashboardAnalytics} fallback={null}>
            {(resolved) => (
              <ReportAnalytics
                analytics={resolved}
                websites={websites}
                onResolve={setRetained}
              />
            )}
          </Await>
        </>
      ) : (
        <WelcomeEmptyState />
      )}
    </>
  );
}
