import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import markdownToHtml from "@/lib/markdownToHtml";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentBySlug, getDocumentSlugs } from "outstatic/server";

export const dynamic = "force-static";

function getData(slug: string) {
  const blog = getDocumentBySlug("blog", slug, [
    "title",
    "publishedAt",
    "description",
    "slug",
    "content",
  ]);

  if (!blog) notFound();

  return { ...blog, content: markdownToHtml(blog.content) };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const blog = getData(params.slug);

  return {
    title: blog.title,
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

export default function Page({ params }: { params: { slug: string } }) {
  const blog = getData(params.slug);
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-4 py-4 md:py-10">
      <meta itemProp="image" content={getOgImageUrl("blog/" + params.slug)} />
      <CardDescription>
        <Link href="/blog">← Blog</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-balance text-4xl font-semibold tracking-tighter">
            {blog.title}
          </CardTitle>
          <CardDescription>
            {new Date(blog.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-zinc max-w-3xl dark:prose-invert prose-pre:whitespace-pre-wrap">
          <div
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(blog.content),
            }}
          ></div>
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return getDocumentSlugs("blog").map((slug) => ({ slug }));
}
