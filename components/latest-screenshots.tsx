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
import { formatBytes } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { LocalTime } from "./local-time";
import FetchWebsitePagesData, {
  WebsitePageData,
} from "./server/fetch-website-pages-data";

interface LatestScreenshotsProps {
  websitePagesData?: WebsitePageData[];
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
  const response = await FetchWebsitePagesData({
    slug: slug,
    page: page ? page : 1,
    limit: limit ? limit : 10,
  });
  const websitePagesData = response.data;

  return (
    <Card>
      {websitePagesData && websitePagesData.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>URL</TableHead>
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
                      href={`https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev/${websitePage.image_key}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev/resized/75x40/${websitePage.image_key}`}
                        alt={websitePage.title}
                        className="h-6 w-14 rounded border-[0.5px] bg-cover bg-center"
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
                        {websitePage.title
                          ? websitePage.title
                          : websitePage.page_url}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatBytes(websitePage.size_in_bytes)}
                  </TableCell>
                  <TableCell>
                    {<LocalTime timeString={websitePage.updated_at} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {showPagination && (
            <CardFooter className="flex justify-between border-t-[0.5px] p-2">
              <Button variant="outline">Previous</Button>
              <Button variant="outline">Next</Button>
            </CardFooter>
          )}
        </>
      ) : (
        <CardHeader>
          <CardTitle>No OG images generated yet</CardTitle>
          <CardDescription>Add a website to get started.</CardDescription>
        </CardHeader>
      )}
    </Card>
  );
};

export default LatestScreenshots;
