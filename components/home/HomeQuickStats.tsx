"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { formatBytes } from "@/lib/utils";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
} from "convex/react";
import WebsitesStatCardClient from "./WebsitesStatCardClient";

function ImagesStatCard({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{count.toLocaleString()}</CardTitle>
        <CardDescription>OG Images</CardDescription>
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

function ImageStatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4.5 w-16" />
        </CardTitle>
        <CardDescription>OG Images</CardDescription>
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

// Loading skeleton for all stats
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
          <CardDescription>OG Images</CardDescription>
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

export default function HomeQuickStats() {
  const userStats = useQuery(api.stats.getUserStats);
  const subscriptionInfo = useQuery(api.billing.getCurrentSubscription);

  const totalImages = userStats?.total_images ?? 0;
  const totalStorageBytes = userStats?.total_storage_bytes ?? 0;
  const plan = subscriptionInfo?.plan ?? "free";
  const isActive = subscriptionInfo?.is_active ?? false;

  const isLoading = userStats === undefined || subscriptionInfo === undefined;

  return (
    <>
      <Unauthenticated>
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
              <CardDescription>OG Images</CardDescription>
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
      </Unauthenticated>
      <Authenticated>
        {isLoading ? (
          <StatsLoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <WebsitesStatCardClient />
            <ImagesStatCard count={totalImages} />
            <StorageStatCard bytes={totalStorageBytes} />
            <SubscriptionStatCard plan={plan} isActive={isActive} />
          </div>
        )}
      </Authenticated>
    </>
  );
}
