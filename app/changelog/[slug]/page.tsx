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
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const changelog = getData(params.slug);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Link href="/changelog" className="text-primary">
            Changelogs
          </Link>
          <span>→</span>
          <span>{changelog.title}</span>
        </CardTitle>
        <CardDescription>
          See what's new in the latest version of our app.
        </CardDescription>
      </CardHeader>
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
        <CardContent className="prose prose-sm prose-slate pb-2">
          <div
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(changelog.content),
            }}
          ></div>
        </CardContent>
      </Card>
    </div>
  );
}

export function generateStaticParams() {
  return getDocumentSlugs("changelog").map((slug) => ({ slug }));
}
