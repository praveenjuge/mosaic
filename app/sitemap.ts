import { website_url } from "@/lib/constants";
import type { MetadataRoute } from "next";
import { getDocumentSlugs } from "outstatic/server";
import { guides } from "./help/guides";

export const dynamic = "force-static";

export type sitemap = {
  url: string;
  lastModified: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogList = [] as sitemap[];
  const blogSlugs = getDocumentSlugs("blog");
  for (const slug of blogSlugs) {
    blogList.push({
      url: `${website_url}blog/${slug}`,
      lastModified: new Date(),
    });
  }

  const changelogList = [] as sitemap[];
  const changelogSlugs = getDocumentSlugs("changelog");
  for (const slug of changelogSlugs) {
    changelogList.push({
      url: `${website_url}changelog/${slug}`,
      lastModified: new Date(),
    });
  }

  const helpList = [] as sitemap[];
  const helpSlugs = getDocumentSlugs("help");
  for (const slug of helpSlugs) {
    helpList.push({
      url: `${website_url}help/${slug}`,
      lastModified: new Date(),
    });
  }

  const guidesList = [] as sitemap[];
  guides
    .map((guide) => ({ slug: guide.slug }))
    .forEach(({ slug }) => {
      guidesList.push({
        url: `${website_url}help/guides/${slug}`,
        lastModified: new Date(),
      });
    });

  return [
    {
      url: website_url,
      lastModified: new Date(),
    },
    {
      url: `${website_url}analytics`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}blog`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}changelog`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}help`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}legal`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}settings`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}subscription`,
      lastModified: new Date(),
    },
    {
      url: `${website_url}websites`,
      lastModified: new Date(),
    },
    ...blogList,
    ...changelogList,
    ...helpList,
    ...guidesList,
  ];
}
