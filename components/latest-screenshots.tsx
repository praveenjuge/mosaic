"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { formatBytes } from '@/lib/utils';
import { WebsitePageData } from './server/fetch-website-pages-data';

interface LatestScreenshotsProps {
  websitePagesData: WebsitePageData[];
}


const LatestScreenshots: React.FC<LatestScreenshotsProps> = ({ websitePagesData }) => {

  const formatUTCDateToLocalWithAMPM = (utcDateString: string) => {
    // Parse the UTC date string into a Date object
    utcDateString = utcDateString + "Z";
    const utcDate = new Date(utcDateString);

    // Extract the local time components with AM/PM notation
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true, // This will include the AM/PM notation
    } as const;

    // Format the date according to the local time zone with AM/PM
    return utcDate.toLocaleString('en-US', options);
  }


  return (
    <Card>
      {websitePagesData.length > 0 ? (
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
                      href={`https://ddvbpf2rl5x5r.cloudfront.net/${websitePage.image_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`https://ddvbpf2rl5x5r.cloudfront.net/${websitePage.image_key}`}
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
                        href={`https://ddvbpf2rl5x5r.cloudfront.net/${websitePage.image_key}`}
                        className="max-w-xs truncate font-medium text-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {websitePage.title ? websitePage.title : websitePage.website_page_url}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(websitePage.size_in_bytes)}</TableCell>
                  <TableCell>{formatUTCDateToLocalWithAMPM(websitePage.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* {showPagination && (
            <CardFooter className="flex justify-between border-t-[0.5px] p-2">
              <Button variant="outline">Previous</Button>
              <Button variant="outline">Next</Button>
            </CardFooter>
          )} */}
        </>
      ) : (
        <CardHeader>
          <CardTitle>No screenshots yet</CardTitle>
        </CardHeader>
      )}
    </Card>
  );
};

export default LatestScreenshots;
