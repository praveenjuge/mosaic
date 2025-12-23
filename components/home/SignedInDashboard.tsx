"use client";

import HomeQuickStats from "@/components/home/HomeQuickStats";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import LatestScreenshots from "@/components/latest-screenshots";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddWebsite from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { api } from "@/convex/_generated/api";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
} from "convex/react";

export default function SignedInDashboard() {
  const websitesCount = useQuery(api.sites.countForUser);

  return (
    <>
      <Unauthenticated>
        <div className="text-muted-foreground">Please sign in to view your dashboard.</div>
      </Unauthenticated>
      <Authenticated>
        {websitesCount === undefined ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : !websitesCount ? (
          <WelcomeEmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <CardHeader className="p-0">
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <HomeQuickStats />
            </div>
            <div className="flex flex-col gap-2">
              <CardHeader className="flex items-center justify-between p-0">
                <CardTitle>Websites</CardTitle>
                <AddWebsite />
              </CardHeader>
              <WebsitesTable />
            </div>
            <div className="flex flex-col gap-2">
              <CardHeader className="p-0">
                <CardTitle>Latest OG Images</CardTitle>
              </CardHeader>
              <LatestScreenshots limit={10} />
            </div>
          </>
        )}
      </Authenticated>
    </>
  );
}
