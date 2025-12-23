"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/convex/stats";
import { formatBytes } from "@/lib/utils";
import { Authenticated, Unauthenticated } from "convex/react";

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
  planDisplayName,
  isActive,
}: {
  planDisplayName: string;
  isActive: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={isActive ? "text-green-600" : ""}>
          {planDisplayName}
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

export default function HomeQuickStats({
  stats,
}: {
  stats: DashboardStats | null | undefined;
}) {
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
        {!stats ? (
          <StatsLoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>{stats.total_websites.toLocaleString()}</CardTitle>
                <CardDescription>Websites</CardDescription>
              </CardHeader>
            </Card>
            <ImagesStatCard count={stats.total_images} />
            <StorageStatCard bytes={stats.total_storage_bytes} />
            <SubscriptionStatCard
              planDisplayName={stats.plan_display_name}
              isActive={stats.is_active}
            />
          </div>
        )}
      </Authenticated>
    </>
  );
}
