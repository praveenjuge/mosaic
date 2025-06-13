import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownContent, getMarkDownData } from "@/lib/getMarkdown";
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
  const help = getMarkDownContent("content/help/", params.slug);

  return {
    title: help.title,
    description: help.description,
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl("help/" + params.slug),
        alt: help.title,
      },
    },
  };
}

// Help navigation component
function HelpNavigation() {
  return (
    <CardDescription>
      <Link href="/help">← Help</Link>
    </CardDescription>
  );
}

// Help header component
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

// Help content component
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

// Loading skeletons
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
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  );
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const help = getMarkDownContent("content/help/", params.slug);

  if (!help) notFound();

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
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

export async function generateStaticParams() {
  const posts = getMarkDownData("content/help/");

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
