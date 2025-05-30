import LatestScreenshots from "@/components/latest-screenshots";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsData } from "@/lib/database-helpers";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AnalyticsQuickStats from "./AnalyticsQuickStats";
import { MosaicAreaChart } from "./areaChart";
import { MosaicBarChart } from "./barChart";

export default async function AnalyticsSignedIn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = {};
  const userData = await auth();

  try {
    if (userData?.userId) {
      data = await getAnalyticsData(userData.userId);
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return (
    <SignedIn>
      <AnalyticsQuickStats />

      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Images Served</CardTitle>
            <CardDescription>
              Showing total images served last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MosaicAreaChart datapoints={data.page_hits} datakey="Served" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images Generated</CardTitle>
            <CardDescription>
              Showing total images generated last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MosaicBarChart
              datapoints={data.website_page_analytics}
              datakey="Generated"
            />
          </CardContent>
        </Card>
      </div>

      <CardHeader className="p-0">
        <CardTitle>Latest Screenshots</CardTitle>
      </CardHeader>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <LatestScreenshots page={1} limit={10} />
      </Suspense>
    </SignedIn>
  );
}
