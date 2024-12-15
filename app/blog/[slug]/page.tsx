import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMarkDownContent, getMarkDownData } from "@/lib/getMarkdown";
import markdownToHtml from "@/lib/markdownToHtml";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-static";

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

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const blog = getMarkDownContent("content/blog/", params.slug);

  if (!blog) notFound();

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <meta itemProp="image" content={getOgImageUrl("blog/" + params.slug)} />
      <CardDescription>
        <Link href="/blog">← Blog</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-balance text-2xl font-bold tracking-tight">
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
        <CardContent className="prose prose-zinc max-w-2xl dark:prose-invert prose-pre:whitespace-pre-wrap">
          <div
            dangerouslySetInnerHTML={{
              __html: blog.content,
            }}
          ></div>
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return getMarkDownData("content/blog/").map((item) => ({ slug: item.slug }));
}
