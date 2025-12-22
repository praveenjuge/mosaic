import HomeQuickStats from "@/components/home/HomeQuickStats";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import LatestScreenshots from "@/components/latest-screenshots";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWebsite } from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { Plus } from "lucide-react";
import { Suspense } from "react";

// Content wrapper that shows either empty state or dashboard
async function DashboardContent() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  let websitesCount = 0;
  try {
    const token = await getToken({ template: "convex" });
    websitesCount = await fetchQuery(
      api.sites.countForUser,
      {},
      token ? { token } : {},
    );
  } catch (error) {
    console.error("Error fetching website count:", error);
  }

  // Show empty state if no websites
  if (!websitesCount) {
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
                <Plus className="size-4" strokeWidth={2} />
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
  return <DashboardContent />;
}
