import LatestScreenshots from "@/components/latest-screenshots";
import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes, getOgImageUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: params.slug,
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl("websites/" + params.slug),
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

export default async function Page({ params }: { params: { slug: string } }) {
  let websiteData: any = {};
  let websitePagesData = [];
  const response = await FetchWebsitePagesData({ slug: params.slug });
  if (!response || !response?.data) {
    notFound();
  } else {
    websitePagesData = response.data;
  }

  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      websiteData = await fetchWebsiteData(token, params.slug);
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return (
    <>
      <CardHeader className="p-0">
        <CardDescription>
          <Link href="/websites">← Back</Link>
        </CardDescription>
        <CardTitle>{websiteData.cleaned_website_url}</CardTitle>
      </CardHeader>

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
            <CardTitle>{formatBytes(websiteData.total_bytes)}</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <CardHeader className="p-0">
        <CardTitle>Latest Screenshots</CardTitle>
      </CardHeader>
      <LatestScreenshots websitePages={websitePagesData} />
    </>
  );
}
