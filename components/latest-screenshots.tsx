"use client";

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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ScreenshotWithDetails } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
} from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LocalTime } from "./local-time";

interface LatestScreenshotsProps {
  slug?: Id<"sites">;
  cursor?: string;
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
          {data.map((item) => {
            const pageUrl = item.page_url.replace(/\\+$/, "");
            const displayUrl = pageUrl.replace(/^https?:\/\//, "");

            return (
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
                      alt={pageUrl || "Screenshot"}
                      className="h-6 w-12 rounded border-[0.5px] bg-cover bg-center object-cover"
                      width={56}
                      height={24}
                    />
                  </Link>
                </TableCell>
                <TableCell>
                  {pageUrl ? (
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary max-w-xs truncate font-medium hover:underline"
                    >
                      {displayUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Unknown page</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {item.website_name ?? "Unknown website"}
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
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

// Pagination component
function ScreenshotsPagination({
  cursor,
  hasMore,
}: {
  cursor: string | null;
  hasMore: boolean;
}) {
  if (!hasMore || !cursor) return null;

  return (
    <CardFooter className="flex justify-center">
      <Link href={`?cursor=${encodeURIComponent(cursor)}`}>
        <Button variant="outline">Load More</Button>
      </Link>
    </CardFooter>
  );
}

const LatestScreenshots: React.FC<LatestScreenshotsProps> = ({
  slug,
  cursor: initialCursor,
  limit,
  showPagination,
}) => {
  const [cursor, setCursor] = useState(initialCursor);

  useEffect(() => {
    setCursor(initialCursor);
  }, [initialCursor]);

  // Get screenshots for a specific website
  const websiteScreenshotsQuery = useQuery(
    api.screenshots.listLatestForWebsite,
    slug
      ? {
          websiteId: slug,
          cursor: cursor ?? undefined,
          limit: limit || 10,
        }
      : "skip"
  );

  // Get latest screenshots from all user's websites (for homepage)
  const userScreenshotsQuery = useQuery(
    api.screenshots.listLatestForUser,
    slug ? "skip" : { limit: limit || 10 }
  );

  const renderWebsiteScreenshots = () => {
    if (!websiteScreenshotsQuery || websiteScreenshotsQuery === null) {
      return websiteScreenshotsQuery === null ? <ScreenshotsError /> : <ScreenshotsTableSkeleton />;
    }
    if (websiteScreenshotsQuery.data.length === 0) {
      return <ScreenshotsEmpty />;
    }
    return (
      <>
        <ScreenshotsTable data={websiteScreenshotsQuery.data} />
        {showPagination && (
          <ScreenshotsPagination
            cursor={websiteScreenshotsQuery.cursor ?? null}
            hasMore={websiteScreenshotsQuery.hasMore}
          />
        )}
      </>
    );
  };

  const renderUserScreenshots = () => {
    if (!userScreenshotsQuery || userScreenshotsQuery === null) {
      return userScreenshotsQuery === null ? <ScreenshotsError /> : <ScreenshotsTableSkeleton />;
    }
    if (userScreenshotsQuery.length === 0) {
      return <ScreenshotsEmpty />;
    }
    return <ScreenshotsTable data={userScreenshotsQuery} />;
  };

  return (
    <>
      <Unauthenticated>
        <div className="text-muted-foreground">Please sign in to view screenshots.</div>
      </Unauthenticated>
      <Authenticated>
        {slug ? renderWebsiteScreenshots() : renderUserScreenshots()}
      </Authenticated>
    </>
  );
};

export default LatestScreenshots;
