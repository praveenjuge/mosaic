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
  const blog = getMarkDownContent("content/blog/", params.slug);

  return {
    title: blog.title,
    description: markdownToHtml(blog.content),
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl("blog/" + params.slug),
        alt: blog.title,
      },
    },
  };
}

// Blog navigation component
function BlogNavigation() {
  return (
    <CardDescription>
      <Link href="/blog">← Blog</Link>
    </CardDescription>
  );
}

// Blog header component
function BlogHeader({ blog }: { blog: MarkdownContent }) {
  return (
    <CardHeader>
      <CardTitle className="text-balance">{blog.title}</CardTitle>
      <CardDescription className="text-balance">
        {blog.description}
      </CardDescription>
      <CardDescription>
        {new Date(blog.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </CardDescription>
    </CardHeader>
  );
}

// Blog content component
function BlogContent({ blog }: { blog: MarkdownContent }) {
  return (
    <CardContent
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{
        __html: markdownToHtml(blog.content),
      }}
    />
  );
}

// Loading skeletons
function BlogHeaderSkeleton() {
  return (
    <CardHeader>
      <Skeleton className="mb-2 h-8 w-3/4" />
      <Skeleton className="mb-1 h-4 w-full" />
      <Skeleton className="mb-1 h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </CardHeader>
  );
}

function BlogContentSkeleton() {
  return (
    <CardContent className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  );
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const blog = getMarkDownContent("content/blog/", params.slug);

  if (!blog) notFound();

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <meta itemProp="image" content={getOgImageUrl("blog/" + params.slug)} />

      <Suspense fallback={<Skeleton className="h-4 w-16" />}>
        <BlogNavigation />
      </Suspense>

      <Card>
        <Suspense fallback={<BlogHeaderSkeleton />}>
          <BlogHeader blog={blog} />
        </Suspense>

        <Suspense fallback={<BlogContentSkeleton />}>
          <BlogContent blog={blog} />
        </Suspense>
      </Card>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = getMarkDownData("content/blog/");

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
