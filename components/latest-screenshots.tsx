import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

const LatestScreenshots: React.FC<LatestScreenshotsProps> = ({
  websitePages,
  showPagination = true,
}) => {
  return (
    <section>
      <CardHeader className="mb-4 p-0">
        <CardTitle>Latest Screenshots</CardTitle>
      </CardHeader>
      <Card>
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
            {websitePages.map((website_page: any) => (
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
                    <img
                      src={
                        "https://ddvbpf2rl5x5r.cloudfront.net/" +
                        website_page.image_key
                      }
                      alt={website_page.title}
                      className="h-6 w-14 rounded border-[0.5px] bg-cover bg-center"
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
                {/* <TableCell>{website_page.page_url}</TableCell> */}
                {/* <TableCell>{website_page.title}</TableCell> */}
                <TableCell>{formatBytes(website_page.size_in_bytes)}</TableCell>
                <TableCell>
                  {new Date(website_page.updated_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {showPagination && (
          <CardFooter className="flex justify-between">
            <Button variant="outline">Previous</Button>
            <Button variant="outline">Next</Button>
          </CardFooter>
        )}
      </Card>
    </section>
  );
};

export default LatestScreenshots;
