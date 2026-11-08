import { GetCodeButton } from "@/components/dashboard/get-code-button";
import { useWebsiteActions } from "@/components/dashboard/use-website-actions";
import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import type { DashboardImageSummary, DashboardStats } from "@/lib/types";
import { cleanDisplayUrl, publicImageUrl } from "@/lib/url";
import { formatBytes } from "@/lib/utils";
import { useTransition } from "react";
import { Code, ImageOff, RefreshCcw } from "vadivam-react";
import { DashboardPanel } from "./dashboard-panel";

function ImageCard({ item }: { item: DashboardImageSummary }) {
  const [isRegenerating, startRegenerating] = useTransition();
  const { regeneratePage } = useWebsiteActions();
  const screenshotUrl = publicImageUrl(item.key);

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
          <GetCodeButton
            hostname={item.url_base}
            pageUrl={item.page_url}
            variant="ghost"
            size="icon-sm"
            aria-label={`Get code for ${cleanDisplayUrl(item.page_url)}`}
            title="Get code"
          >
            <Code />
          </GetCodeButton>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isRegenerating}
            onClick={() => {
              startRegenerating(async () => {
                await regeneratePage(item.page_url);
              });
            }}
            aria-label={`Regenerate ${cleanDisplayUrl(item.page_url)}`}
            title="Regenerate"
          >
            <RefreshCcw className={isRegenerating ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
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
