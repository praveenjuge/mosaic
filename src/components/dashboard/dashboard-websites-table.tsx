import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { LazyWebsiteCodeDialog } from "@/components/websites/lazy-website-code-dialog";
import type { DashboardAnalytics, TrafficCounts } from "@/lib/site-analytics";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";
import { Code } from "vadivam-react";
import { totalRequests } from "./dashboard-overview";
import { DashboardPanel } from "./dashboard-panel";

/** Each website's counts by hostname, once the analytics have loaded. */
type SiteCounts = Map<string, TrafficCounts> | "loading" | "unavailable";

function siteCounts(analytics: DashboardAnalytics | null): SiteCounts {
  if (!analytics) return "loading";
  if (!analytics.available) return "unavailable";
  return new Map(Object.entries(analytics.sites));
}

function Requests({
  sites,
  hostname,
}: {
  sites: SiteCounts;
  hostname: string;
}) {
  if (sites === "loading") return <Skeleton className="h-4 w-10" />;
  if (sites === "unavailable")
    return <span className="text-muted-foreground">—</span>;
  const counts = sites.get(hostname);
  return <>{formatNumber(counts ? totalRequests(counts) : 0)}</>;
}

function WebsiteRow({
  website,
  sites,
}: {
  website: DashboardStats["websites"][number];
  sites: SiteCounts;
}) {
  const [codeOpen, setCodeOpen] = useState(false);
  const fullUrl = `https://${website.url_base}`;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`;

  return (
    <TableRow>
      <TableCell className="pl-5">
        <div className="flex items-center gap-3">
          <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-md border">
            <img
              src={faviconUrl}
              alt=""
              className="size-3.5"
              width={14}
              height={14}
            />
          </span>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-40 truncate font-medium hover:underline sm:max-w-xs"
          >
            {website.url_base}
          </a>
        </div>
      </TableCell>
      <TableCell className="hidden tabular-nums sm:table-cell">
        {formatNumber(website.image_count)}
      </TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">
        <Requests sites={sites} hostname={website.url_base} />
      </TableCell>
      <TableCell className="text-muted-foreground hidden lg:table-cell">
        {website.last_generated_at ? (
          <RelativeTime timestamp={website.last_generated_at} />
        ) : (
          "Never"
        )}
      </TableCell>
      <TableCell className="pr-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCodeOpen(true);
            }}
            aria-label="Get code"
          >
            <Code />
            <span className="hidden sm:inline">Get code</span>
          </Button>
          <WebsiteActions
            websiteId={website.id}
            currentUrl={website.url_base}
            imageCount={website.image_count}
          />
        </div>
        <LazyWebsiteCodeDialog
          hostname={website.url_base}
          open={codeOpen}
          onOpenChange={setCodeOpen}
        />
      </TableCell>
    </TableRow>
  );
}

export function DashboardWebsitesTable({
  dashboardStats,
  analytics,
}: {
  dashboardStats: DashboardStats;
  analytics: DashboardAnalytics | null;
}) {
  const sites = siteCounts(analytics);
  return (
    <DashboardPanel
      title="Websites"
      description="Pages on these hostnames get OG images from Mosaic."
      action={<AddWebsite />}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent!">
            <TableHead className="pl-5">Website</TableHead>
            <TableHead className="hidden sm:table-cell">OG images</TableHead>
            <TableHead className="hidden md:table-cell">
              Requests (7d)
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              Last generated
            </TableHead>
            <TableHead className="pr-5 text-right!">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dashboardStats.websites.map((website) => (
            <WebsiteRow key={website.id} website={website} sites={sites} />
          ))}
        </TableBody>
      </Table>
    </DashboardPanel>
  );
}
