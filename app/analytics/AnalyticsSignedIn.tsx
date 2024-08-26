import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes, parseBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { MosaicAreaChart } from "./areaChart";
import { MosaicBarChart } from "./barChart";

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

  const data = await response.json();
  return data;
}

export default async function AnalyticsSignedIn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = {};
  const userData = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaData: any = await userData?.sessionClaims?.public_metadata;
  try {
    const token = await userData.getToken({ template: "supabase" });
    if (token) {
      const response = await fetchAnalyticsData(token);
      data = response;
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return (
    <>
      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {metaData.images_used || data.total_count} out of {metaData.images_limit || 500}
            </CardTitle>
            <CardDescription>Images Generated</CardDescription>
            <Progress
              className="h-2"
              value={
                ((metaData.images_used || data.total_count) * 100) /
                (metaData.images_limit || 500)
              }
            />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {metaData.storage_used || formatBytes(data.total_bytes)}/
              {metaData.storage_limit || "50 MB"}
            </CardTitle>
            <CardDescription>Storage Used</CardDescription>
            <Progress
              className="h-2"
              value={
                (data.total_bytes * 100) /
                (parseBytes(metaData.storage_limit) || 1048576 * 50)
              }
            />
          </CardHeader>
        </Card>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Images Served</CardTitle>
            <CardDescription>
              Showing total images served last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MosaicAreaChart
              datapoints={data.page_hits}
              datakey="Served"
            />
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
    </>
  );
}
