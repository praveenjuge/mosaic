import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserStats } from "@/lib/database-helpers";
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

// Loading skeleton component
function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4.5 w-16" />
          </CardTitle>
          <CardDescription>OG Images Generated</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4.5 w-20" />
          </CardTitle>
          <CardDescription>Storage Used</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4.5 w-24" />
          </CardTitle>
          <CardDescription>Subscription</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

// Stats content component
async function StatsContent() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>0</CardTitle>
            <CardDescription>OG Images Generated</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>0 MB</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Subscription</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  try {
    const userStats = await getUserStats();
    const totalImages = userStats?.total_images ?? 0;
    const totalStorageBytes = userStats?.total_storage_bytes ?? 0;
    const formattedStorage = formatBytes(totalStorageBytes);

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{totalImages.toLocaleString()}</CardTitle>
            <CardDescription>OG Images Generated</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formattedStorage}</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Subscription</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading user stats in HomeQuickStats:", error);

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>0</CardTitle>
            <CardDescription>OG Images Generated</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>0 MB</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Subscription</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
}

export default function HomeQuickStats() {
  return (
    <Suspense fallback={<StatsLoadingSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
