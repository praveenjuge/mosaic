import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOgImageUrl } from "@/lib/utils";
import { BrandX, Envelope } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { load } from "outstatic/server";
import Guides from "./guides";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Help & Support",
  description:
    "Find solutions to common issues and get help with troubleshooting.",
  openGraph: {
    images: [getOgImageUrl("help")],
  },
};

// Define the type for the posts
type Post = {
  title: string;
  slug: string;
  category: string;
};

const allPosts = (await (await load())
  .find({ collection: "help" }, ["title", "slug", "category"])
  .sort({ publishedAt: -1 })
  .toArray()) as unknown as Post[];

export default function Page() {
  // Group posts by category
  const groupedPosts = allPosts.reduce(
    (acc: Record<string, Post[]>, post: Post) => {
      if (!acc[post.category]) {
        acc[post.category] = [];
      }
      acc[post.category].push(post);
      return acc;
    },
    {},
  );

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>

      <Guides />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Object.entries(groupedPosts).map(([category, posts]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 font-medium text-primary">
              {posts.map((post) => (
                <Link key={post.slug} href={`/help/${post.slug}`}>
                  {post.title}
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Further Assistance?</CardTitle>
          <CardDescription>
            If you can&apos;t find the answer you&apos;re looking for, please
            don&apos;t hesitate to reach out to our support email or send a DM
            on X.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="mailto:hello@praveenjuge.com"
            className={buttonVariants()}
          >
            <Envelope className="mr-2 size-4 stroke-2" />
            Email Support
          </Link>
          <Link
            href="https://x.com/mosaicimg"
            target="_blank"
            className={buttonVariants({ variant: "outline" })}
          >
            <BrandX className="mr-2 size-4 stroke-2" />
            Send a DM on X
          </Link>
          {/* TODO */}
          {/* <a href="#" className={buttonVariants({ variant: "outline" })}>
            <Ticket className="mr-2 size-4" />
            Submit a Ticket
          </a> */}
        </CardContent>
      </Card>
    </div>
  );
}
