import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMarkDownData } from "@/lib/getMarkdown";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Our thoughts and ideas about everything. Mostly OG Images.",
  openGraph: {
    images: [getOgImageUrl("blog")],
  },
};

const allPosts = getMarkDownData("content/blog/");

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>

      {allPosts.map((item) => (
        <Link key={item.slug} href={`/blog/${item.slug}`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-balance">
                {item.title}
              </CardTitle>
              <CardDescription>
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
              <CardDescription className="line-clamp-3">
                {item.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
