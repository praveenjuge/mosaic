import { getGuide } from "@/lib/content";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/guides/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide) {
      throw notFound();
    }

    return { guide };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.guide.title;
    const description = loaderData?.guide.description;
    const seo = buildSeoMeta({
      title,
      description,
      image: getOgImageUrl(`help/guides/${params.slug}`),
      path: `/help/guides/${params.slug}`,
      type: "article",
    });

    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: title,
            description,
            url: absoluteUrl(`/help/guides/${params.slug}`),
          }),
        },
      ],
    };
  },
});
