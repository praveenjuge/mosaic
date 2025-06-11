import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/lib/database-helpers";
import { ScreenshotWithDetails } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import React from "react";
import { LocalTime } from "./local-time";

interface LatestScreenshotsProps {
  slug?: string;
  page?: number;
  limit?: number;
  showPagination?: boolean;
}

const LatestScreenshots: React.FC<LatestScreenshotsProps> = async ({
  slug,
  page,
  limit,
  showPagination,
}) => {
  const { userId } = await auth();

  // Debug info
  console.log("[LatestScreenshots] Component props:", { slug, page, limit });
  console.log("[LatestScreenshots] User ID:", userId);

  if (!userId) {
    return (
      <CardHeader className="py-6">
        <CardTitle>No screenshots available</CardTitle>
        <CardDescription>
          Please sign in to view your screenshots.
        </CardDescription>
      </CardHeader>
    );
  }

  let websitePagesData: Array<ScreenshotWithDetails> = [];

  if (slug) {
    // Get screenshots for a specific website
    const response = await getLatestScreenshotsForWebsite(
      slug,
      page || 1,
      limit || 10,
    );

    if (!response) {
      return (
        <CardHeader className="py-6">
          <CardTitle>Error loading screenshots</CardTitle>
          <CardDescription>
            Unable to fetch screenshots from the database.
          </CardDescription>
        </CardHeader>
      );
    }

    websitePagesData = response.data;
  } else {
    // Get latest screenshots from all user's websites (for homepage)
    const response = await getLatestScreenshotsForAllUserWebsites(
      limit || 5,
    );

    if (!response) {
      return (
        <CardHeader className="py-6">
          <CardTitle>Error loading screenshots</CardTitle>
          <CardDescription>
            Unable to fetch screenshots from the database.
          </CardDescription>
        </CardHeader>
      );
    }

    websitePagesData = response;
  }

  // Debug final data
  console.log("[LatestScreenshots] Final websitePagesData:", websitePagesData);
  console.log("[LatestScreenshots] Data length:", websitePagesData?.length);
  console.log("[LatestScreenshots] First item:", websitePagesData?.[0]);

  return (
    <>
      {websitePagesData && websitePagesData.length > 0
        ? (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>URL</TableHead>
                  {!slug && <TableHead>Website</TableHead>}
                  <TableHead>Size</TableHead>
                  <TableHead>Last refreshed at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websitePagesData.map((websitePage) => (
                  <TableRow key={websitePage.id}>
                    <TableCell className="py-0">
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href={websitePage.screenshot_url}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={websitePage.screenshot_url}
                          alt={websitePage.page_title || websitePage.page_url}
                          className="h-6 w-14 rounded border-[0.5px] bg-cover bg-center object-cover"
                          width={56}
                          height={24}
                        />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={websitePage.page_url}
                          className="max-w-xs truncate font-medium text-primary"
                        >
                          {websitePage.page_title
                            ? websitePage.page_title
                            : websitePage.page_url}
                        </Link>
                      </div>
                    </TableCell>
                    {!slug && (
                      <TableCell>
                        {websitePage.website_name || "Unknown"}
                      </TableCell>
                    )}
                    <TableCell>
                      {formatBytes(websitePage.size_in_bytes)}
                    </TableCell>
                    <TableCell>
                      {<LocalTime timeString={websitePage.generated_at} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {showPagination && slug && (
              <CardFooter className="flex justify-between border-t-[0.5px] p-2">
                <Button variant="outline">Previous</Button>
                <Button variant="outline">Next</Button>
              </CardFooter>
            )}
          </Card>
        )
        : (
          <Card>
            <CardHeader>
              <CardTitle>No OG images generated yet</CardTitle>
              <CardDescription>Add a website to get started.</CardDescription>
            </CardHeader>
          </Card>
        )}
    </>
  );
};

export default LatestScreenshots;
