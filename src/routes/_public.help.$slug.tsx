import { ArticlePage } from "@/components/help/article-page";
import { buildArticleHead } from "@/lib/seo";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/$slug")({
  loader: async ({ params }) => {
    // Loaded with the first article, so other pages skip the server
    // function runtime.
    const { getHelpArticle } = await import("@/server/content");
    const help = await getHelpArticle({ data: params.slug });
    if (!help) {
      throw notFound();
    }

    return { help };
  },
  component: HelpArticlePage,
  head: ({ loaderData, params }) =>
    buildArticleHead({
      path: `/help/${params.slug}`,
      title: loaderData?.help.title,
      description: loaderData?.help.description,
      schemaType: "Article",
      datePublished: loaderData?.help.publishedAt,
    }),
});

function HelpArticlePage() {
  const { help } = Route.useLoaderData();

  return (
    <ArticlePage
      title={help.title}
      eyebrow={help.category}
      description={help.description}
      html={help.contentHtml}
    />
  );
}
