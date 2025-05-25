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

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const changelog = getMarkDownContent("content/changelog/", params.slug);

  if (!changelog) notFound();

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <meta
        itemProp="image"
        content={getOgImageUrl("changelog/" + params.slug)}
      />
      <CardDescription>
        <Link href="/changelog">← Changelog</Link>
      </CardDescription>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-0">
          <CardTitle>{changelog.title}</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm prose-zinc max-w-none pb-2 dark:prose-invert">
          <div
            dangerouslySetInnerHTML={{
              __html: changelog.content,
            }}
          >
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return getMarkDownData("content/changelog/").map((item) => ({
    slug: item.slug,
  }));
}
