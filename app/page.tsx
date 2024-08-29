import HomeQuickStats from "@/components/home/HomeQuickStats";
import HomeSignedOut from "@/components/home/homesignedout";
import LatestScreenshots from "@/components/latest-screenshots";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { website_description, website_subtitle } from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Metadata } from "next";
import { Suspense } from "react";
import WebsitesTable from "./websites/WebsitesTable";

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
        <CardHeader className="p-0">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <HomeQuickStats />
        </Suspense>
        <CardHeader className="p-0">
          <CardTitle>Websites</CardTitle>
        </CardHeader>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <WebsitesTable />
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
