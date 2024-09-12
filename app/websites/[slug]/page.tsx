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
import { WebsiteInfoModal } from "../WebsiteInfoModal";
import { SmileGhost } from "@mynaui/icons-react";
import { RefreshSiteButton } from "../refresh-site-button";

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
  let token: string | null = null;

  try {
    const { getToken } = auth();
    token = await getToken({ template: "supabase" });
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

        <div className="flex items-center justify-between">
          <CardTitle>{websiteData?.cleaned_website_url}</CardTitle>
          {websiteData?.total_count !== 0 && (
            // Button to refresh all the pages
            <RefreshSiteButton websiteId={params.slug} token={token} variant="outline"></RefreshSiteButton>
          )}
        </div>
      </CardHeader>

      {websiteData?.total_count === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-lg border-[0.5px] border-emerald-300 bg-emerald-50 p-3 font-medium dark:border-emerald-950 dark:bg-emerald-950 md:flex-row md:items-center md:justify-between" role="alert">
          <div className="flex items-center gap-3">
            <SmileGhost className="size-6 shrink-0 text-primary" />
            <p>
              It looks like you haven&apos;t added Mosaic to your website yet. Let&apos;s get you set up!
            </p>
          </div>
          <WebsiteInfoModal websiteUrl={websiteData?.cleaned_website_url} />
        </div>
      )}

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
