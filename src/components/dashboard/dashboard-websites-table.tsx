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
import { buildSiteOgImageUrl } from "@/lib/platform";
import type { DashboardStats } from "@/lib/types";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString + "Z"); // D1 datetime('now') is UTC
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes}m ago`;
  if (diffHours < 24)
    return `${diffHours}h ago`;
  if (diffDays < 30)
    return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function WebsiteRow({
  website,
}: {
  website: DashboardStats["websites"][number];
}) {
  const fullUrl = `https://${website.url_base}`;
  const ogImageUsageUrl = buildSiteOgImageUrl(
    "https://mosaicimg.com/",
    fullUrl,
  );
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`;

  return (
    <TableRow className="items-center">
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            src={faviconUrl}
            alt="Favicon"
            className="size-3.5"
            width={14}
            height={14}
          />
          <a
            href={fullUrl}
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
            href={ogImageUsageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-lg truncate font-medium"
          >
            {decodeURIComponent(ogImageUsageUrl)}
          </a>
          <CopyButton text={decodeURIComponent(ogImageUsageUrl)} />
        </div>
      </TableCell>
      <TableCell className="py-0">
        {website.image_count === 0 ? (
          <WebsiteInfoModal websiteUrl={website.url_base} />
        ) : (
          website.image_count
        )}
      </TableCell>
      <TableCell className="py-0">
        {website.refreshed_at ? (
          <span
            className="text-muted-foreground text-sm"
            title={new Date(website.refreshed_at + "Z").toLocaleString()}
          >
            {formatRelativeTime(website.refreshed_at)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
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
              <TableHead>Last Refreshed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboardStats.websites.map((website) => (
              <WebsiteRow key={website.id} website={website} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
