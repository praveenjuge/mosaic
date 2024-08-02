import LatestScreenshots from "@/components/latest-screenshots";
import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes, getOgImageUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImagesChart } from "./imageschart";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your logs and analytics here.",
  openGraph: {
    images: [getOgImageUrl("analytics")],
  },
};

async function fetchAnalyticsData(token: string) {
  const url = "https://get.mosaicimg.com/api/analytics/";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let data = await response.json();
  return data;
}

export default async function Page() {
  let data: any = {};
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      const response = await fetchAnalyticsData(token);
      data = response;
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  let websitePagesData = [];
  const response = await FetchWebsitePagesData({ page: 1, limit: 10 });
  if (!response || !response?.data) {
    console.log("No data");
  } else {
    websitePagesData = response.data;
  }

  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{data.total_count}</CardTitle>
            <CardDescription>Images Generated</CardDescription>
            <Progress className="h-2" value={(data.total_count * 100) / 500} />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatBytes(data.total_bytes)}/50 MB</CardTitle>
            <CardDescription>Storage Used</CardDescription>
            <Progress
              className="h-2"
              value={(data.total_bytes * 100) / (1048576 * 50)}
            />
          </CardHeader>
        </Card>
        {/* TODO */}
        {/* <Card>
          <CardHeader>
            <CardTitle>114,431</CardTitle>
            <CardDescription>Times Viewed</CardDescription>
            <Progress className="h-2" value={77} />
          </CardHeader>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images Generated</CardTitle>
          <CardDescription>
            Showing total images generated last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImagesChart page_hits={data.page_hits} />
        </CardContent>
      </Card>

      <LatestScreenshots websitePages={websitePagesData} />
    </>
  );
}
