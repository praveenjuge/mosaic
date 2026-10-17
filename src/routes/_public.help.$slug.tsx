import { ArticlePage } from "@/components/help/article-page";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { getHelpArticle } from "@/server/content";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/$slug")({
  loader: async ({ params }) => {
    const help = await getHelpArticle({ data: params.slug });
    if (!help) {
      throw notFound();
    }

    return { help };
  },
  component: HelpArticlePage,
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

function HelpArticlePage() {
  const { help } = Route.useLoaderData();

  return (
    <ArticlePage
      title={help.title}
      subtitle={
        <span className="bg-muted text-muted-foreground inline-block rounded px-2 py-1 text-xs font-medium">
          {help.category}
        </span>
      }
      html={help.contentHtml}
    />
  );
}
