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
import { load } from "outstatic/server";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Changelog",
  description: "See what's new in the latest version of mosaic.",
};

const allPosts = await (await load())
  .find({ collection: "changelog" }, [
    "title",
    "slug",
    "publishedAt",
    "content",
  ])
  .sort({ publishedAt: -1 })
  .toArray();

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>

      {allPosts.map((item) => (
        <Link key={item.slug} href={`/changelog/${item.slug}`}>
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm prose-zinc max-w-none pb-2 dark:prose-invert">
              <div
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(item.content),
                }}
              ></div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
