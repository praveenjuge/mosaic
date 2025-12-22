import { website_url } from "@/lib/constants";
import { getMarkDownData } from "@/lib/getMarkdown";
import type { MetadataRoute } from "next";
import { guides } from "./help/guides";

export const dynamic = "force-static";

type SitemapEntry = {
  url: string;
  lastModified: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    '',
    'blog',
    'changelog',
    'faq',
    'help',
    'legal',
  ].map(path => ({
    url: `${website_url}${path}`,
    lastModified: new Date(),
  }));

  // Helper function to generate sitemap entries for content
  const generateContentEntries = (contentPath: string, urlPrefix: string): SitemapEntry[] => {
    return getMarkDownData(contentPath)
      .map(({ slug }) => ({
        url: `${website_url}${urlPrefix}/${slug}`,
        lastModified: new Date(),
      }));
  };

  // Generate entries for different content types
  const blogEntries = generateContentEntries("content/blog/", "blog");
  const changelogEntries = generateContentEntries("content/changelog/", "changelog");
  const helpEntries = generateContentEntries("content/help/", "help");

  // Generate guide entries
  const guideEntries = guides.map(({ slug }) => ({
    url: `${website_url}help/guides/${slug}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...blogEntries,
    ...changelogEntries,
    ...helpEntries,
    ...guideEntries,
  ];
}
