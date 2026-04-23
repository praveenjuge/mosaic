import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

function ImagesStatCard({
  countDisplay,
  limitDisplay,
}: {
  countDisplay: string;
  limitDisplay: string;
}) {
  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>
          {countDisplay}/{limitDisplay}
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
              <CardTitle>{dashboardStats.total_websites_display}</CardTitle>
              <CardDescription>Websites</CardDescription>
            </CardHeader>
          </Card>
          <ImagesStatCard
            countDisplay={dashboardStats.total_images_display}
            limitDisplay={dashboardStats.images_limit_display}
          />
        </div>
      </div>
    </div>
  );
}
