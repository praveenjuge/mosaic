import LatestScreenshots from "@/components/latest-screenshots";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, getOgImageUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: params.slug,
    description: "Manage your website's OG settings here.",
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl(""),
        alt: params.slug,
      },
    },
  };
}

async function fetchWebsiteData(token: string, websiteId: string) {
  const url = "https://get.mosaicimg.com/api/websites/" + websiteId;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

interface WebsiteData {
  cleaned_website_url: string;
  total_count: number;
  total_bytes: number;
  // Add other properties as needed
}

export default async function Page({ params }: { params: { slug: string } }) {
  let websiteData: WebsiteData | null = null;

  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      try {
        websiteData = await fetchWebsiteData(token, params.slug);
      } catch (error) {
        console.error("Error:", error);
        notFound()
      }
    } else {
      console.log("No token available");
      return <div>Error: No token available.</div>;
    }
  } catch (error) {
    console.error("Error:", error);
    return <Skeleton className="h-24 w-full rounded-lg" />
  }

  if (!websiteData) {
    return <Skeleton className="h-24 w-full rounded-lg" />
  }


  return (
    <>
      <CardHeader className="p-0">
        <CardDescription>
          <Link href="/websites">← Back</Link>
        </CardDescription>
        <CardTitle>{websiteData?.cleaned_website_url}</CardTitle>
      </CardHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{websiteData?.total_count}</CardTitle>
            <CardDescription>Images</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>30 Days</CardTitle>
            <CardDescription>Cache Days</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatBytes(websiteData?.total_bytes ?? 0)}</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <CardHeader className="p-0">
        <CardTitle>Latest Screenshots</CardTitle>
      </CardHeader>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <LatestScreenshots slug={params.slug} page={1} />
      </Suspense>
    </>
  );
}
