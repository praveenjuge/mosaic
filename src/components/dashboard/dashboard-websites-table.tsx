import { CopyButton } from "@/components/copy-button";
import {
  Card,
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
import AddWebsite from "@/components/websites/AddWebsite";
import { WebsiteActions } from "@/components/websites/WebsiteActions";
import { WebsiteInfoModal } from "@/components/websites/WebsiteInfoModal";
import type { DashboardStats } from "@/lib/types";

function WebsiteRow({
  screenshotCount,
  website,
}: {
  screenshotCount: number;
  website: DashboardStats["websites"][number];
}) {
  return (
    <TableRow className="items-center">
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            src={website.favicon_url}
            alt="Favicon"
            className="size-3.5"
            width={14}
            height={14}
          />
          <a
            href={website.full_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary max-w-xs truncate font-medium"
          >
            {website.url_base}
          </a>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <a
            href={website.og_image_usage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-lg truncate font-medium"
          >
            {decodeURIComponent(website.og_image_usage_url)}
          </a>
          <CopyButton text={website.og_image_usage_url} />
        </div>
      </TableCell>
      <TableCell className="py-0">
        {screenshotCount === 0 ? (
          <WebsiteInfoModal websiteUrl={website.url_base} />
        ) : (
          screenshotCount
        )}
      </TableCell>
      <TableCell className="flex items-center p-0.5">
        <WebsiteActions websiteId={website.id} currentUrl={website.url_base} />
      </TableCell>
    </TableRow>
  );
}

export function DashboardWebsitesTable({
  dashboardStats,
}: {
  dashboardStats: DashboardStats;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <CardHeader className="flex items-center justify-between p-0">
        <CardTitle>Websites</CardTitle>
        <AddWebsite />
      </CardHeader>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Website</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>OG Images</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboardStats.websites.map((website) => (
              <WebsiteRow
                key={website.id}
                website={website}
                screenshotCount={
                  dashboardStats.screenshot_counts[String(website.id)] ?? 0
                }
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
