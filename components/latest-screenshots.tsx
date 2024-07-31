"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

interface LatestScreenshotsProps {
  websitePages: any[];
  showPagination?: boolean;
}

const LatestScreenshots: React.FC<LatestScreenshotsProps> = ({ websitePages, showPagination = true }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Screenshots</CardTitle>
        <CardDescription>
          Some of the latest Open Graph (OG) images generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last refreshed at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {websitePages.map((website_page: any) => (
              <TableRow key={website_page.id}>
                <TableCell>
                  <img
                    src={"https://ddvbpf2rl5x5r.cloudfront.net/" + website_page.image_key}
                    alt={website_page.title}
                    className="size-16"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={
                        "https://ddvbpf2rl5x5r.cloudfront.net/" +
                        website_page.image_key
                      }
                      className="max-w-xs truncate font-medium text-primary"
                      target="_blank"
                    >
                      {website_page.title
                        ? website_page.title
                        : website_page.website_page_url}
                    </Link>
                  </div>
                </TableCell>
                {/* <TableCell>{website_page.page_url}</TableCell> */}
                <TableCell>{website_page.title}</TableCell>
                <TableCell>
                  {formatBytes(website_page.size_in_bytes)}
                </TableCell>
                <TableCell>
                  {new Date(website_page.updated_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {showPagination && (
        <CardFooter className="flex justify-between">
          <Button variant="outline">Previous</Button>
          <Button variant="outline">Next</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default LatestScreenshots;