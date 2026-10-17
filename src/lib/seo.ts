import {
  author_name,
  website_description,
  website_name,
  website_subtitle,
} from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { getOgImageUrl } from "@/lib/url";

type SeoConfig = {
  description?: string;
  path?: string;
  title?: string;
  type?: "article" | "website";
};

export function absoluteUrl(path = "") {
  return new URL(path.replace(/^\//, ""), publicEnv.siteUrl).toString();
}

export function pageTitle(title?: string) {
  return title
    ? `${title} - ${website_name} - ${website_subtitle}`
    : `${website_name} - ${website_subtitle}`;
}

/** Page meta tags. The OG image is a Mosaic screenshot of the page itself. */
export function buildSeoMeta({
  description = website_description,
  path = "/",
  title,
  type = "website",
}: SeoConfig) {
  const canonicalUrl = absoluteUrl(path);
  const resolvedImage = getOgImageUrl(path);
  const resolvedTitle = pageTitle(title);

  return {
    canonicalUrl,
    meta: [
      { title: resolvedTitle },
      { name: "description", content: description },
      { property: "og:title", content: resolvedTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalUrl },
      { property: "og:type", content: type },
      { property: "og:image", content: resolvedImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: resolvedTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: resolvedImage },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
  };
}

/** Head for a content article: meta tags plus schema.org JSON-LD. */
export function buildArticleHead({
  path,
  title,
  description,
  schemaType,
  datePublished,
}: {
  path: string;
  title?: string;
  description?: string;
  schemaType: "Article" | "TechArticle";
  datePublished?: string;
}) {
  return {
    ...buildSeoMeta({ title, description, path, type: "article" }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": schemaType,
          headline: title,
          description,
          datePublished,
          url: absoluteUrl(path),
        }),
      },
    ],
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "BusinessApplication",
    author: {
      "@type": "Person",
      name: author_name,
    },
    description: website_description,
    name: website_name,
    operatingSystem: "Web",
    url: publicEnv.siteUrl,
  };
}
