import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownContent } from "@/lib/getMarkdown";
import type { MarkdownContent } from "@/lib/types";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_public/help/$slug")({
  loader: ({ params }) => {
    const help = getMarkDownContent("src/content/help/", params.slug);
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
  component: HelpArticlePage,
});

function HelpNavigation() {
  return (
    <CardDescription>
      <Link to="/help">{"<-"} Help</Link>
    </CardDescription>
  );
}

function HelpHeader({ help }: { help: MarkdownContent }) {
  return (
    <CardHeader className="pb-0">
      <CardTitle>{help.title}</CardTitle>
      <CardDescription>
        <span className="bg-muted text-muted-foreground inline-block rounded px-2 py-1 text-xs font-medium">
          {help.category}
        </span>
      </CardDescription>
    </CardHeader>
  );
}

function HelpContent({ help }: { help: MarkdownContent }) {
  return (
    <CardContent
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{
        __html: help.content,
      }}
    />
  );
}

function HelpHeaderSkeleton() {
  return (
    <CardHeader className="pb-0">
      <Skeleton className="mb-2 h-8 w-3/4" />
      <Skeleton className="h-6 w-20 rounded-md" />
    </CardHeader>
  );
}

function HelpContentSkeleton() {
  return (
    <CardContent className="space-y-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </CardContent>
  );
}

function HelpArticlePage() {
  const { help } = Route.useLoaderData();

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <Suspense fallback={<Skeleton className="h-4 w-16" />}>
        <HelpNavigation />
      </Suspense>

      <Card>
        <Suspense fallback={<HelpHeaderSkeleton />}>
          <HelpHeader help={help} />
        </Suspense>

        <Suspense fallback={<HelpContentSkeleton />}>
          <HelpContent help={help} />
        </Suspense>
      </Card>
    </article>
  );
}
