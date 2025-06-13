import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserStats, getUserSubscriptionInfo } from "@/lib/database-helpers";
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

// Loading skeleton component
function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4.5 w-16" />
          </CardTitle>
          <CardDescription>Websites</CardDescription>
        </CardHeader>
      </Card>
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

// Individual stat card components for better granularity
function WebsitesStatCard({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{count.toLocaleString()}</CardTitle>
        <CardDescription>Websites</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ImagesStatCard({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{count.toLocaleString()}</CardTitle>
        <CardDescription>OG Images Generated</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StorageStatCard({ bytes }: { bytes: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatBytes(bytes)}</CardTitle>
        <CardDescription>Storage Used</CardDescription>
      </CardHeader>
    </Card>
  );
}

function SubscriptionStatCard({
  plan,
  isActive,
}: {
  plan: string;
  isActive: boolean;
}) {
  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case "pro":
        return "Pro Plan";
      case "pro-yearly":
        return "Pro Yearly";
      case "free":
      default:
        return "Free Plan";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isActive ? "text-green-600" : ""}>
          {getPlanDisplayName(plan)}
        </CardTitle>
        <CardDescription>Subscription</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Individual loading skeletons for each stat
function WebsiteStatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4.5 w-16" />
        </CardTitle>
        <CardDescription>Websites</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ImageStatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4.5 w-16" />
        </CardTitle>
        <CardDescription>OG Images Generated</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StorageStatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4.5 w-20" />
        </CardTitle>
        <CardDescription>Storage Used</CardDescription>
      </CardHeader>
    </Card>
  );
}

function SubscriptionStatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4.5 w-24" />
        </CardTitle>
        <CardDescription>Subscription</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Stats content component with granular loading
async function StatsContent() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>0</CardTitle>
            <CardDescription>Websites</CardDescription>
          </CardHeader>
        </Card>
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
    const [userStats, subscriptionInfo] = await Promise.all([
      getUserStats(),
      getUserSubscriptionInfo(),
    ]);

    const totalWebsites = userStats?.total_websites ?? 0;
    const totalImages = userStats?.total_images ?? 0;
    const totalStorageBytes = userStats?.total_storage_bytes ?? 0;

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Suspense fallback={<WebsiteStatSkeleton />}>
          <WebsitesStatCard count={totalWebsites} />
        </Suspense>

        <Suspense fallback={<ImageStatSkeleton />}>
          <ImagesStatCard count={totalImages} />
        </Suspense>

        <Suspense fallback={<StorageStatSkeleton />}>
          <StorageStatCard bytes={totalStorageBytes} />
        </Suspense>

        <Suspense fallback={<SubscriptionStatSkeleton />}>
          <SubscriptionStatCard
            plan={subscriptionInfo.plan}
            isActive={subscriptionInfo.is_active}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading user stats in HomeQuickStats:", error);

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>0</CardTitle>
            <CardDescription>Websites</CardDescription>
          </CardHeader>
        </Card>
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
