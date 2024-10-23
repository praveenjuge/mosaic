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
  const help = getDocumentBySlug("help", slug, [
    "title",
    "publishedAt",
    "slug",
    "content",
  ]);

  if (!help) notFound();

  return { ...help, content: markdownToHtml(help.content) };
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const help = getData(params.slug);

  return {
    title: help.title,
    description: markdownToHtml(help.content),
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

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const help = getData(params.slug);
  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <CardDescription>
        <Link href="/help">← Help</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{help.title}</CardTitle>
          <CardDescription>
            {new Date(help.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm prose-zinc max-w-none pb-2 dark:prose-invert">
          <div
            dangerouslySetInnerHTML={{
              __html: help.content,
            }}
          ></div>
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return getDocumentSlugs("help").map((slug) => ({ slug }));
}
