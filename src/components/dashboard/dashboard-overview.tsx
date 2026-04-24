import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLimit, formatNumber } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

function ImagesStatCard({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>
          {formatNumber(count)}/{formatLimit(limit)}
        </CardTitle>
        <CardDescription>OG Images</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function DashboardOverview({
  dashboardStats,
}: {
  dashboardStats: DashboardStats;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="px-4">
              <CardTitle>
                {formatNumber(dashboardStats.total_websites)}
              </CardTitle>
              <CardDescription>Websites</CardDescription>
            </CardHeader>
          </Card>
          <ImagesStatCard
            count={dashboardStats.total_images}
            limit={dashboardStats.images_limit}
          />
        </div>
      </div>
    </div>
  );
}
