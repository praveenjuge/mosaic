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

export const metadata: Metadata = {
  title: "Changelogs",
};

const allChangelogs = await (await load())
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
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Changelog</CardTitle>
        <CardDescription>
          See what's new in the latest version of our app.
        </CardDescription>
      </CardHeader>
      {allChangelogs.map((item) => (
        <Card key={item.slug}>
          <CardHeader>
            <CardTitle>
              <Link href={`/changelog/${item.slug}`}>{item.title}</Link>
            </CardTitle>
            <CardDescription>{item.publishedAt}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm prose-slate">
              {markdownToHtml(item.content)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
