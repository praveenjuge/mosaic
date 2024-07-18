import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Envelope } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { load } from "outstatic/server";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Help & Support",
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
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Help & Support</CardTitle>
        <CardDescription>
          Find solutions to common issues and get help with troubleshooting.
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(groupedPosts).map(([category, posts]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-primary">
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
            If you can't find the answer you're looking for, please don't
            hesitate to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <a href="mailto:hello@praveenjuge.com" className={buttonVariants()}>
            <Envelope className="mr-2 size-4" />
            Email Support
          </a>
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
