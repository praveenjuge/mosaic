import type { MetadataRoute } from "next";
import { getDocumentSlugs } from "outstatic/server";

export const dynamic = "force-static";

const domain = "https://mosaicimg.com";

export type sitemap = {
  url: string;
  lastModified: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogList = [] as sitemap[];
  const blogSlugs = getDocumentSlugs("blog");
  for (const slug of blogSlugs) {
    blogList.push({
      url: `${domain}/blog/${slug}`,
      lastModified: new Date(),
    });
  }

  const changelogList = [] as sitemap[];
  const changelogSlugs = getDocumentSlugs("changelog");
  for (const slug of changelogSlugs) {
    changelogList.push({
      url: `${domain}/changelog/${slug}`,
      lastModified: new Date(),
    });
  }

  const helpList = [] as sitemap[];
  const helpSlugs = getDocumentSlugs("help");
  for (const slug of helpSlugs) {
    helpList.push({
      url: `${domain}/help/${slug}`,
      lastModified: new Date(),
    });
  }

  return [
    {
      url: domain,
      lastModified: new Date(),
    },
    {
      url: `${domain}/analytics`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/blog`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/changelog`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/help`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/legal`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/settings`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/subscription`,
      lastModified: new Date(),
    },
    {
      url: `${domain}/websites`,
      lastModified: new Date(),
    },
    ...blogList,
    ...changelogList,
    ...helpList,
  ];
}
