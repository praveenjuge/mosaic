import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { LazyWebsiteCodeDialog } from "@/components/websites/lazy-website-code-dialog";
import { useWebsiteActions } from "@/components/websites/use-website-actions";
import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { buildPublicImageUrl, cleanDisplayUrl } from "@/lib/url";
import { formatBytes } from "@/lib/utils";
import { Code, ImageOff, RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { DashboardPanel } from "./dashboard-panel";

/** The page's path and query, which the code dialog shows after the host. */
function pagePath(pageUrl: string): string {
  const { pathname, search } = new URL(pageUrl);
  return `${pathname}${search}`.replace(/^\/+/, "");
}

function ImageCard({ item }: { item: DashboardImageSummary }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [isRegenerating, startRegenerating] = useTransition();
  const { regeneratePage } = useWebsiteActions();
  const screenshotUrl = buildPublicImageUrl(item.key);

  return (
    <li className="group flex min-w-0 flex-col overflow-hidden rounded-lg border">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={screenshotUrl}
        className="bg-muted relative block aspect-[1.91/1] overflow-hidden border-b"
      >
        <img
          src={screenshotUrl}
          alt={`OG image for ${item.page_url}`}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          width={390}
          height={204}
          loading="lazy"
        />
      </a>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <a
            href={item.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium hover:underline"
          >
            {cleanDisplayUrl(item.page_url)}
          </a>
          <p className="text-muted-foreground mt-0.5 text-xs">
            <RelativeTime timestamp={item.generated_at} /> ·{" "}
            {formatBytes(item.size_in_bytes)}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCodeOpen(true)}
            aria-label={`Get code for ${cleanDisplayUrl(item.page_url)}`}
            title="Get code"
          >
            <Code />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isRegenerating}
            onClick={() =>
              startRegenerating(async () => {
                await regeneratePage(item.page_url);
              })
            }
            aria-label={`Regenerate ${cleanDisplayUrl(item.page_url)}`}
            title="Regenerate"
          >
            <RefreshCcw className={isRegenerating ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
      <LazyWebsiteCodeDialog
        hostname={item.url_base}
        initialPath={pagePath(item.page_url)}
        protocol={
          new URL(item.page_url).protocol === "http:" ? "http:" : "https:"
        }
        open={codeOpen}
        onOpenChange={setCodeOpen}
      />
    </li>
  );
}

export function DashboardLatestImages({
  latestScreenshots,
  className,
}: {
  latestScreenshots: DashboardStats["latest_screenshots"];
  className?: string;
}) {
  return (
    <DashboardPanel
      title="Latest OG images"
      description="Regenerate a page after you change it."
      className={className}
    >
      {latestScreenshots.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-5 pt-4 pb-10 text-center text-sm">
          <ImageOff className="size-5" aria-hidden="true" />
          <p className="text-foreground font-medium">No OG images yet</p>
          <p>Images appear here once a page on your website is requested.</p>
        </div>
      ) : (
        <ul className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
          {latestScreenshots.map((item) => (
            <ImageCard key={item.key} item={item} />
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
