import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/convex/stats";
import { Authenticated, Unauthenticated } from "convex/react";

interface StatCardSkeletonProps {
  titleWidth: string;
  description: string;
}

function StatCardSkeleton({ titleWidth, description }: StatCardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className={`h-4.5 ${titleWidth}`} />
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCardSkeleton titleWidth="w-16" description="Websites" />
      <StatCardSkeleton titleWidth="w-16" description="OG Images" />
      <StatCardSkeleton titleWidth="w-24" description="Subscription" />
    </div>
  );
}

interface HomeQuickStatsProps {
  stats: DashboardStats | null | undefined;
}

export default function HomeQuickStats({ stats }: HomeQuickStatsProps) {
  return (
    <>
      <Unauthenticated>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>0</CardTitle>
              <CardDescription>Websites</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>0</CardTitle>
              <CardDescription>OG Images</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>Subscription</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Unauthenticated>
      <Authenticated>
        {!stats ? (
          <StatsLoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{stats.total_websites_display}</CardTitle>
                <CardDescription>Websites</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{stats.total_images_display}</CardTitle>
                <CardDescription>OG Images</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className={stats.is_active ? "text-green-600" : ""}>
                  {stats.plan_display_name}
                </CardTitle>
                <CardDescription>Subscription</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}
      </Authenticated>
    </>
  );
}
