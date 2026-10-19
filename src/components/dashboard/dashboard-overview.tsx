import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardAnalytics, TrafficCounts } from "@/lib/site-analytics";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import type { ReactNode } from "react";

export function totalRequests(counts: TrafficCounts): number {
  return counts.cached + counts.generated + counts.fallback;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border px-5 py-4 shadow-xs">
      <p className="text-muted-foreground text-sm">{label}</p>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {detail ? (
        <p className="text-muted-foreground text-xs">{detail}</p>
      ) : null}
    </div>
  );
}

function TrafficStats({ analytics }: { analytics: DashboardAnalytics | null }) {
  if (!analytics) {
    return (
      <>
        {["Image requests", "Served from cache"].map((label) => (
          <StatCard
            key={label}
            label={label}
            value={<Skeleton className="h-8 w-20" />}
            detail="Last 7 days"
          />
        ))}
      </>
    );
  }
  if (!analytics.available) {
    return (
      <>
        <StatCard label="Image requests" value="—" detail="Unavailable" />
        <StatCard label="Served from cache" value="—" detail="Unavailable" />
      </>
    );
  }
  const requests = totalRequests(analytics.totals);
  const cacheRate = requests
    ? Math.round((analytics.totals.cached / requests) * 100)
    : null;
  return (
    <>
      <StatCard
        label="Image requests"
        value={formatNumber(requests)}
        detail="Last 7 days"
      />
      <StatCard
        label="Served from cache"
        value={cacheRate === null ? "—" : `${cacheRate}%`}
        detail={`${formatNumber(analytics.totals.generated)} new screenshots`}
      />
    </>
  );
}

export function DashboardOverview({
  dashboardStats,
  analytics,
}: {
  dashboardStats: DashboardStats;
  /** `null` while the analytics query is still loading. */
  analytics: DashboardAnalytics | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Websites"
        value={formatNumber(dashboardStats.total_websites)}
      />
      <StatCard
        label="OG images"
        value={formatNumber(dashboardStats.total_images)}
        detail="Cached and ready to serve"
      />
      <TrafficStats analytics={analytics} />
    </div>
  );
}
