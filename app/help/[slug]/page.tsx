import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMarkDownContent, getMarkDownData } from "@/lib/getMarkdown";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const help = getMarkDownContent("content/help/", params.slug);

  if (!help) notFound();
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
        <CardContent className="prose prose-sm prose-zinc dark:prose-invert max-w-none pb-2">
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
  return getMarkDownData("content/help/").map((item) => ({ slug: item.slug }));
}
