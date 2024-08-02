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
          <CardTitle className="text-3xl font-semibold tracking-tighter">
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
        <CardContent className="prose prose-zinc max-w-3xl dark:prose-invert prose-pre:whitespace-pre-wrap [&_.hljs-addition]:bg-green-950 [&_.hljs-addition]:text-emerald-200 [&_.hljs-attr]:text-sky-300 [&_.hljs-attribute]:text-sky-300 [&_.hljs-built_in]:text-orange-400 [&_.hljs-bullet]:text-amber-300 [&_.hljs-code]:text-gray-400 [&_.hljs-comment]:text-gray-400 [&_.hljs-deletion]:bg-red-950 [&_.hljs-deletion]:text-red-100 [&_.hljs-doctag]:text-red-400 [&_.hljs-emphasis]:italic [&_.hljs-emphasis]:text-gray-300 [&_.hljs-formula]:text-gray-400 [&_.hljs-keyword]:text-red-400 [&_.hljs-literal]:text-sky-300 [&_.hljs-meta]:text-sky-300 [&_.hljs-meta_.hljs-keyword]:text-red-400 [&_.hljs-meta_.hljs-string]:text-blue-300 [&_.hljs-name]:text-green-300 [&_.hljs-number]:text-sky-300 [&_.hljs-operator]:text-sky-300 [&_.hljs-quote]:text-green-300 [&_.hljs-regexp]:text-blue-300 [&_.hljs-section]:font-bold [&_.hljs-section]:text-blue-600 [&_.hljs-selector-attr]:text-sky-300 [&_.hljs-selector-class]:text-sky-300 [&_.hljs-selector-id]:text-sky-300 [&_.hljs-selector-pseudo]:text-green-300 [&_.hljs-selector-tag]:text-green-300 [&_.hljs-string]:text-blue-300 [&_.hljs-strong]:font-bold [&_.hljs-strong]:text-gray-300 [&_.hljs-subst]:text-gray-300 [&_.hljs-symbol]:text-orange-400 [&_.hljs-template-tag]:text-red-400 [&_.hljs-template-variable]:text-red-400 [&_.hljs-title.class_.inherited__]:text-purple-300 [&_.hljs-title.class_]:text-purple-300 [&_.hljs-title.function_]:text-purple-300 [&_.hljs-title]:text-purple-300 [&_.hljs-type]:text-red-400 [&_.hljs-variable.language_]:text-red-400 [&_.hljs-variable]:text-sky-300 [&_.hljs]:bg-gray-950 [&_.hljs]:text-gray-200 [&_code.hljs]:block [&_code.hljs]:overflow-x-auto">
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
