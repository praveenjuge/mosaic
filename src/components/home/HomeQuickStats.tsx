import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";
import { useAuth } from "@clerk/tanstack-react-start";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCardSkeleton titleWidth="w-16" description="Websites" />
      <StatCardSkeleton titleWidth="w-16" description="OG Images" />
    </div>
  );
}

interface HomeQuickStatsProps {
  stats: DashboardStats | null | undefined;
}

export default function HomeQuickStats({ stats }: HomeQuickStatsProps) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>
    );
  }

  if (!stats) {
    return <StatsLoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </div>
  );
}
