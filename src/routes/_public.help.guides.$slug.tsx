import { ArticlePage } from "@/components/help/article-page";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { getGuide } from "@/server/content";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/guides/$slug")({
  loader: async ({ params }) => {
    const guide = await getGuide({ data: params.slug });
    if (!guide) {
      throw notFound();
    }

    return { guide };
  },
  component: GuidePage,
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

function GuidePage() {
  const { guide } = Route.useLoaderData();

  return (
    <ArticlePage
      title={guide.title}
      subtitle={guide.description}
      html={guide.contentHtml}
      footer="Add your hostname in the dashboard first, then test the page with a card validator like metatags.io."
    />
  );
}
