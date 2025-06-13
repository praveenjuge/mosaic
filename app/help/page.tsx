import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarkDownData } from "@/lib/getMarkdown";
import { getOgImageUrl } from "@/lib/utils";
import { BrandX, Envelope } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Guides from "./guides";

export const experimental_ppr = true;

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

const allPosts = getMarkDownData("content/help/");

// Help header component
function HelpHeader() {
  return (
    <CardHeader className="p-0">
      <CardTitle>{metadata.title as string}</CardTitle>
      <CardDescription>{metadata.description}</CardDescription>
    </CardHeader>
  );
}

// Help categories component
function HelpCategories() {
  // Group posts by category
  const groupedPosts = allPosts.reduce<Record<string, Post[]>>((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedPosts).map(([category, posts]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/help/${post.slug}`}
                className="hover:bg-muted/50 block rounded-lg p-3 transition-colors"
              >
                <p className="font-medium">{post.title}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// Guides section component
function GuidesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Guides</CardTitle>
        <CardDescription>
          Step-by-step guides to help you get the most out of our platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Guides />
      </CardContent>
    </Card>
  );
}

// Contact section component
function ContactSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Still Need Help?</CardTitle>
        <CardDescription>
          Can&rsquo;t find what you&rsquo;re looking for? Get in touch with our
          support team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="mailto:hello@praveenjuge.com"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Envelope className="size-4" />
            Email Support
          </Link>
          <Link
            href="https://x.com/PraveenJuge"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <BrandX className="size-4" />
            Twitter Support
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeletons
function HelpHeaderSkeleton() {
  return (
    <div className="p-0">
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

function HelpCategoriesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="mb-2 h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 py-4 md:py-10">
      <Suspense fallback={<HelpHeaderSkeleton />}>
        <HelpHeader />
      </Suspense>

      <Suspense fallback={<HelpCategoriesSkeleton />}>
        <HelpCategories />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <GuidesSection />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <ContactSection />
      </Suspense>
    </div>
  );
}
