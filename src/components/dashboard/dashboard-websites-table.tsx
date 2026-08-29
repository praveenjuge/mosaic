import { CopyButton } from "@/components/copy-button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { publicEnv } from "@/lib/env";
import type { DashboardStats } from "@/lib/types";
import { buildSiteOgImageUrl } from "@/lib/url";

function UsageUrl({ targetUrl }: { targetUrl: string }) {
  const usageUrl = buildSiteOgImageUrl(publicEnv.siteUrl, targetUrl);
  return (
    <div className="flex items-center gap-1">
      <a
        href={usageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="max-w-lg truncate font-medium"
      >
        {decodeURIComponent(usageUrl)}
      </a>
      <CopyButton text={usageUrl} />
    </div>
  );
}

function WebsiteRow({
  website,
}: {
  website: DashboardStats["websites"][number];
}) {
  const fullUrl = `https://${website.url_base}`;
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
        <UsageUrl targetUrl={fullUrl} />
      </TableCell>
      <TableCell className="py-0">
        <WebsiteInfoModal websiteUrl={website.url_base} />
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
              <TableHead>Setup</TableHead>
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
