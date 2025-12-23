"use client";

import HomeQuickStats from "@/components/home/HomeQuickStats";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import LatestScreenshots from "@/components/latest-screenshots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddWebsite from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { api } from "@/convex/_generated/api";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignedInDashboard() {
  const websitesCount = useQuery(api.sites.countForUser);
  const subscriptionInfo = useQuery(api.billing.getCurrentSubscription);
  const userStats = useQuery(api.stats.getUserStats);
  const router = useRouter();

  const imagesLimit = subscriptionInfo?.plan_properties?.images_limit ?? 500;
  const currentImages = userStats?.total_images ?? 0;
  const isFreePlan = subscriptionInfo?.plan === "free";
  const hasExceededLimit = currentImages >= imagesLimit;

  const handleUpgradeClick = () => {
    router.push("/pricing");
  };

  return (
    <>
      <Unauthenticated>
        <div className="text-muted-foreground">
          Please sign in to view your dashboard.
        </div>
      </Unauthenticated>
      <Authenticated>
        {websitesCount === undefined ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : !websitesCount ? (
          <WelcomeEmptyState />
        ) : (
          <>
            {/* Limit Alert - shown above stats section */}
            {isFreePlan &&
              hasExceededLimit &&
              subscriptionInfo &&
              userStats && (
                <Alert variant="destructive" className="mb-8">
                  <AlertTriangle />
                  <AlertTitle>Free Plan Limit Exceeded</AlertTitle>
                  <AlertDescription className="flex items-center justify-between gap-4">
                    <span>
                      You've reached the limit of {imagesLimit} OG images.
                      Upgrade to continue generating images.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUpgradeClick}
                      className="shrink-0"
                    >
                      Upgrade to Pro
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

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
