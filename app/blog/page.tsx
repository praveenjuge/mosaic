import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { load } from "outstatic/server";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Blog",
  description: "Our thoughts and ideas about everything. Mostly OG Images.",
  openGraph: {
    images: [getOgImageUrl("blog")],
  },
};

const allPosts = await (await load())
  .find({ collection: "blog" }, ["title", "slug", "publishedAt", "description"])
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
        <Link key={item.slug} href={`/blog/${item.slug}`}>
          <Card>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
