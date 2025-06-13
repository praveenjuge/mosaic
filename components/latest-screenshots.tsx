import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getLatestScreenshotsForAllUserWebsites,
  getLatestScreenshotsForWebsite,
} from "@/lib/db";
import { ScreenshotWithDetails } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import React, { Suspense } from "react";
import { LocalTime } from "./local-time";

interface LatestScreenshotsProps {
  slug?: string;
  page?: number;
  limit?: number;
  showPagination?: boolean;
}

// Loading skeleton for screenshots table
function ScreenshotsTableSkeleton() {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Error state component
function ScreenshotsError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error loading OG images</CardTitle>
        <CardDescription>
          Unable to fetch OG images from the database.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

// Empty state component
function ScreenshotsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No OG Images found</CardTitle>
        <CardDescription>
          OG Images will appear here once you visit pages on your website.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

// Screenshots table component
function ScreenshotsTable({ data }: { data: ScreenshotWithDetails[] }) {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OG Image</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Last refreshed at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="py-0">
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={item.screenshot_url}
                >
                  {/* eslint-disable @next/next/no-img-element */}
                  <img
                    src={item.screenshot_url}
                    alt={item.page_url}
                    className="h-6 w-12 rounded border-[0.5px] bg-cover bg-center object-cover"
                    width={56}
                    height={24}
                  />
                </Link>
              </TableCell>
              <TableCell>
                <a
                  href={item.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary max-w-xs truncate font-medium hover:underline"
                >
                  {item.page_url.replace(/^https?:\/\//, "")}
                </a>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {item.website_name}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {formatBytes(item.size_in_bytes)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  <LocalTime timeString={item.generated_at} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Pagination component
function ScreenshotsPagination({
  page,
  hasMore,
}: {
  page: number;
  hasMore: boolean;
}) {
  if (!hasMore) return null;

  return (
    <CardFooter className="flex justify-center">
      <Link href={`?page=${page + 1}`}>
        <Button variant="outline">Load More</Button>
      </Link>
    </CardFooter>
  );
}

// Screenshots content component
async function ScreenshotsContent({
  slug,
  page,
  limit,
  showPagination,
}: LatestScreenshotsProps) {
  const { userId } = await auth();

  if (!userId) return null;

  let websitePagesData: Array<ScreenshotWithDetails> = [];
  let hasMore = false;

  if (slug) {
    // Get screenshots for a specific website
    const response = await getLatestScreenshotsForWebsite(
      slug,
      page || 1,
      limit || 10,
    );

    if (!response) {
      return <ScreenshotsError />;
    }

    websitePagesData = response.data;
    hasMore = response.total > (page || 1) * (limit || 10);
  } else {
    // Get latest screenshots from all user's websites (for homepage)
    const response = await getLatestScreenshotsForAllUserWebsites(limit || 10);

    if (!response) {
      return <ScreenshotsError />;
    }

    websitePagesData = response;
  }

  if (websitePagesData.length === 0) {
    return <ScreenshotsEmpty />;
  }

  return (
    <>
      <ScreenshotsTable data={websitePagesData} />
      {showPagination && (
        <Suspense fallback={<div className="h-12" />}>
          <ScreenshotsPagination page={page || 1} hasMore={hasMore} />
        </Suspense>
      )}
    </>
  );
}

const LatestScreenshots: React.FC<LatestScreenshotsProps> = (props) => {
  return (
    <Suspense fallback={<ScreenshotsTableSkeleton />}>
      <ScreenshotsContent {...props} />
    </Suspense>
  );
};

export default LatestScreenshots;
