import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

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
          <Card>
            <CardHeader className="px-4">
              <CardTitle>{formatNumber(dashboardStats.total_images)}</CardTitle>
              <CardDescription>OG Images</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
