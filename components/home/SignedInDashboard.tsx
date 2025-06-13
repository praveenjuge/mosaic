import HomeQuickStats from "@/components/home/HomeQuickStats";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import LatestScreenshots from "@/components/latest-screenshots";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWebsite } from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { getAllWebsitesWithStats } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "@mynaui/icons-react";
import { Suspense } from "react";
import { LoadingSpinner } from "../spinner";

// Content wrapper that shows either empty state or dashboard
async function DashboardContent() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const websites = await getAllWebsitesWithStats();

  // Show empty state if no websites
  if (!websites || websites.length === 0) {
    return <WelcomeEmptyState />;
  }

  // Show full dashboard if user has websites
  return (
    <>
      <div className="flex flex-col gap-2">
        <CardHeader className="p-0">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <HomeQuickStats />
        </Suspense>
      </div>
      <div className="flex flex-col gap-2">
        <CardHeader className="flex items-center justify-between p-0">
          <CardTitle>Websites</CardTitle>
          <Suspense
            fallback={
              <Button size="sm" disabled>
                <Plus className="size-4" stroke={2} />
                Add Website
              </Button>
            }
          >
            <AddWebsite />
          </Suspense>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <WebsitesTable />
        </Suspense>
      </div>
      <div className="flex flex-col gap-2">
        <CardHeader className="p-0">
          <CardTitle>Latest OG Images</CardTitle>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <LatestScreenshots limit={10} />
        </Suspense>
      </div>
    </>
  );
}

export default function SignedInDashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}
