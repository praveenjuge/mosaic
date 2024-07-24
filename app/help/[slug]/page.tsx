import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import markdownToHtml from "@/lib/markdownToHtml";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentBySlug, getDocumentSlugs } from "outstatic/server";

export const dynamic = "force-static";

function getData(slug: string) {
  const help = getDocumentBySlug("help", slug, [
    "title",
    "publishedAt",
    "description",
    "slug",
    "content",
  ]);

  if (!help) notFound();

  return { ...help, content: markdownToHtml(help.content) };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const help = getData(params.slug);

  return {
    title: help.title,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const help = getData(params.slug);
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-4 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>
          <Link href="/help" className="text-primary">
            Help & Support
          </Link>
        </CardTitle>
        <CardDescription>
          Find solutions to common issues and get help with troubleshooting.
        </CardDescription>
      </CardHeader>
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
              __html: markdownToHtml(help.content),
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
