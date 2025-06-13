import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownData } from "@/lib/getMarkdown";
import { MarkdownContent } from "@/lib/types";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Our thoughts and ideas about everything. Mostly OG Images.",
  openGraph: {
    images: [getOgImageUrl("blog")],
  },
};

const allPosts = getMarkDownData("content/blog/");

// Blog header component
function BlogHeader() {
  return (
    <CardHeader className="p-0">
      <CardTitle>{metadata.title as string}</CardTitle>
      <CardDescription>{metadata.description}</CardDescription>
    </CardHeader>
  );
}

// Blog post item component
function BlogPostItem({ post }: { post: MarkdownContent }) {
  return (
    <Link key={post.slug} href={`/blog/${post.slug}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-balance">{post.title}</CardTitle>
          <CardDescription>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
          <CardDescription className="line-clamp-3">
            {post.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

// Blog posts list component
function BlogPostsList() {
  return (
    <>
      {allPosts.map((item) => (
        <BlogPostItem key={item.slug} post={item} />
      ))}
    </>
  );
}

// Loading skeleton for blog posts
function BlogPostsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <Suspense
        fallback={
          <div className="p-0">
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-4 w-64" />
          </div>
        }
      >
        <BlogHeader />
      </Suspense>

      <Suspense fallback={<BlogPostsSkeleton />}>
        <BlogPostsList />
      </Suspense>
    </div>
  );
}
