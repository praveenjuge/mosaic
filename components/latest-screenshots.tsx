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
import FetchWebsitePagesData from "./server/fetch-website-pages-data";

interface LatestScreenshotsProps {
  showPagination?: boolean;
  page?: number;
  limit?: number;
  slug?: string;
}

const LatestScreenshots: React.FC<LatestScreenshotsProps> = async ({
  page = 1,
  limit = 10,
  slug,
  showPagination = true,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let websitePagesData: any[] = [];
  const response = await FetchWebsitePagesData({ page, limit, slug });
  if (!response || !response.data) {
    console.log("No data");
  } else {
    websitePagesData = response.data;
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
              {websitePagesData.map((website_page) => (
                <TableRow key={website_page.id}>
                  <TableCell className="py-0">
                    <Link
                      href={
                        "https://ddvbpf2rl5x5r.cloudfront.net/" +
                        website_page.image_key
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          "https://dgcnyjbu13hj1.cloudfront.net/resized/150x79/" +
                          website_page.image_key
                        }
                        alt={website_page.title}
                        className="h-6 w-14 rounded border-[0.5px] bg-cover bg-center"
                        width={56}
                        height={24}
                      />
                    </Link>
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
                        rel="noopener noreferrer"
                      >
                        {website_page.title
                          ? website_page.title
                          : website_page.website_page_url}
                      </Link>
                    </div>
                  </TableCell>
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
          {/* TODO */}
          {showPagination && (
            <CardFooter className="flex justify-between border-t-[0.5px] p-2">
              <Button variant="outline">Previous</Button>
              <Button variant="outline">Next</Button>
            </CardFooter>
          )}
        </>
      ) : (
        <CardHeader>
          <CardTitle>No screenshots yet</CardTitle>
          <CardDescription>
            Add a new website to start capturing screenshots.
          </CardDescription>
        </CardHeader>
      )}
    </Card>
  );
};

export default LatestScreenshots;
