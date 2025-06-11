import HomeQuickStats from "@/components/home/HomeQuickStats";
import HomeSignedOut from "@/components/home/homesignedout";
import LatestScreenshots from "@/components/latest-screenshots";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWebsite } from "@/components/websites/AddWebsite";
import WebsitesTable from "@/components/websites/WebsitesTable";
import { website_description, website_subtitle } from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Plus } from "@mynaui/icons-react";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: website_subtitle,
  description: website_description,
  openGraph: { images: [getOgImageUrl("")] },
};

export default function Home() {
  return (
    <>
      <SignedOut>
        <HomeSignedOut />
      </SignedOut>
      <SignedIn>
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
            <CardTitle>Latest Screenshots</CardTitle>
          </CardHeader>
          <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
            <LatestScreenshots limit={10} />
          </Suspense>
        </div>
      </SignedIn>
    </>
  );
}
