import { getHelpArticle } from "@/lib/content";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/$slug")({
  loader: ({ params }) => {
    const help = getHelpArticle(params.slug);
    if (!help) {
      throw notFound();
    }

    return { help };
  },
  head: ({ loaderData, params }) => {
    const seo = buildSeoMeta({
      title: loaderData?.help.title,
      description: loaderData?.help.description,
      image: getOgImageUrl(`help/${params.slug}`),
      path: `/help/${params.slug}`,
      type: "article",
    });

    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData?.help.title,
            description: loaderData?.help.description,
            datePublished: loaderData?.help.publishedAt,
            url: absoluteUrl(`/help/${params.slug}`),
          }),
        },
      ],
    };
  },
});
