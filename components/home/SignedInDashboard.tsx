"use client";

import HomeQuickStats from "@/components/home/HomeQuickStats";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import LatestScreenshots from "@/components/latest-screenshots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddWebsite from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SignedInDashboard() {
  const dashboardStats = useQuery(api.stats.getUserDashboardStats);

  return (
    <>
      <Unauthenticated>
        <div className="text-muted-foreground">
          Please sign in to view your dashboard.
        </div>
      </Unauthenticated>
      <Authenticated>
        {dashboardStats === undefined ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : !dashboardStats.total_websites ? (
          <WelcomeEmptyState />
        ) : (
          <>
            {/* Limit Alert - shown above stats section */}
            {dashboardStats.plan === "free" &&
              dashboardStats.has_exceeded_limit && (
                <Alert variant="destructive" className="mb-8">
                  <AlertTriangle />
                  <AlertTitle>Free Plan Limit Exceeded</AlertTitle>
                  <AlertDescription className="flex items-center justify-between gap-4">
                    <span>
                      You've reached the limit of {dashboardStats.images_limit}{" "}
                      OG images. Upgrade to continue generating images.
                    </span>
                    <Link
                      href="/pricing"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "shrink-0",
                      )}
                    >
                      Upgrade to Pro
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

            <div className="flex flex-col gap-2">
              <CardHeader className="p-0">
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <HomeQuickStats stats={dashboardStats} />
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
