import LatestScreenshots from "@/components/latest-screenshots";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWebsiteWithStats } from "@/lib/database-helpers";
import { formatBytes, getOgImageUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { SmileGhost } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WebsiteInfoModal } from "../WebsiteInfoModal";
import { RefreshSiteButton } from "./refresh-site-button";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        title: "Website Details",
        description: "Manage your website's OG settings here.",
      };
    }

    const websiteData = await getWebsiteWithStats(params.slug);

    if (!websiteData || !websiteData.website) {
      return {
        title: "Website Not Found",
        description: "The requested website could not be found.",
      };
    }

    const { website, total_count } = websiteData;
    const websiteName = website.site_name || website.url_base;
    const hasImages = total_count > 0;

    const title = `${websiteName}`;
    const description = hasImages
      ? `Manage ${websiteName} with ${total_count} generated OG images.`
      : `Set up OG image generation for ${websiteName}. Add Mosaic to automatically create Open Graph images.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [getOgImageUrl(`websites/${params.slug}`)],
      },
      twitter: {
        card: "summary_large_image",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Website Dashboard",
      description: "Manage your website's OG settings here.",
      openGraph: {
        images: {
          url: getOgImageUrl("websites"),
          alt: "Mosaic Website Dashboard",
        },
      },
    };
  }
}

async function fetchWebsiteData(websiteId: string) {
  return await getWebsiteWithStats(websiteId);
}

interface WebsiteData {
  website: {
    id: string;
    user_id: string;
    url_base: string;
    site_name: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  total_count: number;
  total_bytes: number;
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  let websiteData: WebsiteData | null = null;

  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("No user ID available");
      return <div>Error: Please sign in to view this page.</div>;
    }

    try {
      websiteData = await fetchWebsiteData(params.slug);
      if (!websiteData) {
        notFound();
      }
    } catch (error) {
      console.error("Error:", error);
      notFound();
    }
  } catch (error) {
    console.error("Error:", error);
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  if (!websiteData || !websiteData.website) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <div className="space-y-1">
          <CardDescription>
            <Link href="/websites">← Back</Link>
          </CardDescription>
          <CardTitle>{websiteData.website.url_base}</CardTitle>
        </div>
        {websiteData.total_count !== 0
          ? <RefreshSiteButton websiteId={params.slug} />
          : (
            // Intentional empty span
            <span></span>
          )}
      </CardHeader>
      {websiteData.total_count === 0 && (
        <div
          className="flex flex-col items-start gap-4 rounded-lg border-[0.5px] border-emerald-300 bg-emerald-50 p-3 font-medium dark:border-emerald-950 dark:bg-emerald-950 md:flex-row md:items-center md:justify-between"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <SmileGhost className="size-6 shrink-0 text-primary" />
            <p>
              It looks like you haven&apos;t added Mosaic to your website yet.
              Let&apos;s get you set up!
            </p>
          </div>
          <WebsiteInfoModal websiteUrl={websiteData.website.url_base} />
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{websiteData.total_count}</CardTitle>
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
            <CardTitle>{formatBytes(websiteData.total_bytes ?? 0)}</CardTitle>
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
