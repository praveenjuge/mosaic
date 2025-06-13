import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownData } from "@/lib/getMarkdown";
import { MarkdownContent } from "@/lib/types";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

export const experimental_ppr = true;

export const metadata: Metadata = {
  title: "Changelog",
  description: "See what's new in the latest version of mosaic.",
  openGraph: {
    images: [getOgImageUrl("changelog")],
  },
};

const allPosts = getMarkDownData("content/changelog/");

// Changelog header component
function ChangelogHeader() {
  return (
    <CardHeader className="p-0 text-center">
      <Image
        src="/illustrations/changelog.png"
        alt="Changelog"
        className="mx-auto mb-4"
        width={300}
        height={300}
      />
      <CardTitle>{metadata.title as string}</CardTitle>
      <CardDescription>{metadata.description}</CardDescription>
    </CardHeader>
  );
}

// Changelog entry component
function ChangelogEntry({ item }: { item: MarkdownContent }) {
  return (
    <Card key={item.slug} className="gap-0 pb-0">
      <CardHeader className="pb-0">
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
        <div
          dangerouslySetInnerHTML={{
            __html: item.content,
          }}
        ></div>
      </CardContent>
    </Card>
  );
}

// Changelog entries list component
function ChangelogEntries() {
  return (
    <>
      {allPosts.map((item) => (
        <ChangelogEntry key={item.slug} item={item} />
      ))}
    </>
  );
}

function ChangelogEntriesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="gap-0 pb-0">
          <CardHeader className="pb-0">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:pb-10">
      <ChangelogHeader />

      <Suspense fallback={<ChangelogEntriesSkeleton />}>
        <ChangelogEntries />
      </Suspense>
    </div>
  );
}
