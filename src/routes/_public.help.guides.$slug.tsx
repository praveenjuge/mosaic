import { ArticlePage } from "@/components/help/article-page";
import { buildArticleHead } from "@/lib/seo";
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
  head: ({ loaderData, params }) =>
    buildArticleHead({
      path: `/help/guides/${params.slug}`,
      title: loaderData?.guide.title,
      description: loaderData?.guide.description,
      schemaType: "TechArticle",
    }),
});

function GuidePage() {
  const { guide } = Route.useLoaderData();

  return (
    <ArticlePage
      title={guide.title}
      eyebrow="Framework guides"
      description={guide.description}
      html={guide.contentHtml}
      footer="Add your hostname in the dashboard first, then test the page with a card validator like metatags.io."
    />
  );
}
