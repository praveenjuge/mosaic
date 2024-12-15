import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMarkDownData } from "@/lib/getMarkdown";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Changelog",
  description: "See what's new in the latest version of mosaic.",
  openGraph: {
    images: [getOgImageUrl("changelog")],
  },
};

const allPosts = getMarkDownData("content/changelog/");

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
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
                  __html: item.content,
                }}
              ></div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
