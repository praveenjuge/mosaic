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
        <Card key={item.slug} className="gap-0 pb-0">
          <CardHeader className="pb-0">
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: item.content,
              }}
            >
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
