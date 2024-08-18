import LatestScreenshots from "@/components/latest-screenshots";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ChartBar, Plus } from "@mynaui/icons-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { AddWebsite } from "../websites/AddWebsite";
import AnalyticsSignedIn from "./AnalyticsSignedIn";

export const experimental_ppr = true;

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your logs and analytics here.",
  openGraph: {
    images: [getOgImageUrl("analytics")],
  },
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <SignedOut>
        <div className="flex w-full flex-col items-center justify-center rounded border-[0.5px] bg-primary-foreground px-4 py-20 text-center">
          <div className="mx-auto rounded-full border-[0.5px] bg-background p-2">
            <ChartBar className="size-6" />
          </div>
          <h3 className="mb-1 mt-2 text-sm font-medium">
            Add your first website to get started with analytics.
          </h3>
          <p className="mb-4 text-balance text-sm text-muted-foreground">
            When you add a website, you will be able to see detailed analytics
            about OG generation here.
          </p>
          <Suspense
            fallback={
              <Button size="sm" disabled>
                <Plus className="mr-1 size-4" stroke={2} />
                Add Website
              </Button>
            }
          >
            <AddWebsite />
          </Suspense>
        </div>
      </SignedOut>
      <SignedIn>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <AnalyticsSignedIn />
        </Suspense>
        <CardHeader className="p-0">
          <CardTitle>Latest Screenshots</CardTitle>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <LatestScreenshots />
        </Suspense>
      </SignedIn>
    </>
  );
}
