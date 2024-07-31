import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  let data = await response.json()
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

  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle>114,431</CardTitle>
            <CardDescription>Times Viewed</CardDescription>
            <Progress className="h-2" value={77} />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images Generated</CardTitle>
          <CardDescription>
            Showing total images generated last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent >
          <ImagesChart page_hits={data.page_hits} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Screenshots</CardTitle>
          <CardDescription>
            Some of the latest Open Graph (OG) images generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.website_pages.map((website_page: any) => (
                <TableRow key={website_page.id}>
                  <TableCell className="flex items-center gap-2">
                    <img
                      src={website_page.favicon_url}
                      alt={website_page.title}
                      className="size-4"
                    />
                    {website_page.page_url}
                  </TableCell>
                  <TableCell>{website_page.title}</TableCell>
                  <TableCell>
                    {formatBytes(website_page.size_in_bytes)}
                  </TableCell>
                  <TableCell>
                    {new Date(website_page.updated_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {/* TODO */}
        <CardFooter className="flex justify-between">
          <Button variant="outline">Previous</Button>
          <Button variant="outline">Next</Button>
        </CardFooter>
      </Card>
    </>
  );
}
