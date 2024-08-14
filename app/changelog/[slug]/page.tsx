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
  const changelog = getDocumentBySlug("changelog", slug, [
    "title",
    "publishedAt",
    "description",
    "slug",
    "content",
  ]);

  if (!changelog) notFound();

  return { ...changelog, content: markdownToHtml(changelog.content) };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const changelog = getData(params.slug);

  return {
    title: changelog.title,
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

export default function Page({ params }: { params: { slug: string } }) {
  const changelog = getData(params.slug);
  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <meta
        itemProp="image"
        content={getOgImageUrl("changelog/" + params.slug)}
      />
      <CardDescription>
        <Link href="/changelog">← Changelog</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{changelog.title}</CardTitle>
          <CardDescription>
            {new Date(changelog.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm prose-zinc max-w-none pb-2 dark:prose-invert">
          <div
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(changelog.content),
            }}
          ></div>
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return getDocumentSlugs("changelog").map((slug) => ({ slug }));
}
