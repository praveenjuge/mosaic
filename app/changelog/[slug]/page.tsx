import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownContent, getMarkDownData } from "@/lib/getMarkdown";
import markdownToHtml from "@/lib/markdownToHtml";
import { MarkdownContent } from "@/lib/types";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const experimental_ppr = true;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const changelog = getMarkDownContent("content/changelog/", params.slug);

  return {
    title: changelog.title,
    description: markdownToHtml(changelog.content),
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl("changelog/" + params.slug),
        alt: changelog.title,
      },
    },
  };
}

// Changelog navigation component
function ChangelogNavigation() {
  return (
    <CardDescription>
      <Link href="/changelog">← Changelog</Link>
    </CardDescription>
  );
}

// Changelog header component
function ChangelogHeader({ changelog }: { changelog: MarkdownContent }) {
  return (
    <CardHeader>
      <CardTitle className="text-balance">{changelog.title}</CardTitle>
      <CardDescription className="text-balance">
        {changelog.description}
      </CardDescription>
      <CardDescription>
        {new Date(changelog.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </CardDescription>
    </CardHeader>
  );
}

// Changelog content component
function ChangelogContent({ changelog }: { changelog: MarkdownContent }) {
  return (
    <CardContent
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{
        __html: markdownToHtml(changelog.content),
      }}
    />
  );
}

// Loading skeletons
function ChangelogHeaderSkeleton() {
  return (
    <CardHeader>
      <Skeleton className="mb-2 h-8 w-3/4" />
      <Skeleton className="mb-1 h-4 w-full" />
      <Skeleton className="mb-1 h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </CardHeader>
  );
}

function ChangelogContentSkeleton() {
  return (
    <CardContent className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  );
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const changelog = getMarkDownContent("content/changelog/", params.slug);

  if (!changelog) notFound();

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <meta
        itemProp="image"
        content={getOgImageUrl("changelog/" + params.slug)}
      />

      <Suspense fallback={<Skeleton className="h-4 w-20" />}>
        <ChangelogNavigation />
      </Suspense>

      <Card>
        <Suspense fallback={<ChangelogHeaderSkeleton />}>
          <ChangelogHeader changelog={changelog} />
        </Suspense>

        <Suspense fallback={<ChangelogContentSkeleton />}>
          <ChangelogContent changelog={changelog} />
        </Suspense>
      </Card>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = getMarkDownData("content/changelog/");

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
