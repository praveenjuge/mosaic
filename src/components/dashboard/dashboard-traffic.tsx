import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardAnalytics, TrafficCounts } from "@/lib/site-analytics";
import { cleanDisplayUrl } from "@/lib/url";
import { cn, formatNumber } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { totalRequests } from "./dashboard-overview";
import { DashboardPanel } from "./dashboard-panel";

/** Stacked bottom to top, in the validated chart order. */
const SERIES: Array<{
  key: keyof TrafficCounts;
  label: string;
  color: string;
  count: (counts: TrafficCounts) => number;
}> = [
  {
    key: "cached",
    label: "From cache",
    color: "bg-chart-1",
    count: (counts) => counts.cached,
  },
  {
    key: "generated",
    label: "New screenshots",
    color: "bg-chart-2",
    count: (counts) => counts.generated,
  },
  {
    key: "fallback",
    label: "Fallbacks",
    color: "bg-chart-3",
    count: (counts) => counts.fallback,
  },
];

function dayLabel(day: string, style: "short" | "long") {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(
    "en-US",
    style === "short"
      ? { weekday: "short", timeZone: "UTC" }
      : { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function Legend({ totals }: { totals: TrafficCounts }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 px-5 text-xs">
      {SERIES.map(({ key, label, color, count }) => (
        <li key={key} className="flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-[2px]", color)}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums">
            {formatNumber(count(totals))}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Day = Extract<DashboardAnalytics, { available: true }>["days"][number];

function Bar({ day, max }: { day: Day; max: number }) {
  const total = totalRequests(day);
  const segments = SERIES.filter(({ count }) => count(day) > 0);

  return (
    <li className="group relative flex h-full flex-1 flex-col items-center justify-end">
      {/* The whole column is the hover and focus target, not just the bar. */}
      <div
        tabIndex={0}
        aria-label={`${dayLabel(day.day, "long")}: ${formatNumber(total)} requests`}
        className="focus-visible:ring-ring/50 flex h-full w-full flex-col items-center justify-end rounded-md outline-none focus-visible:ring-2"
      >
        {total === 0 ? (
          <span className="bg-border h-0.5 w-full max-w-10 rounded-full" />
        ) : (
          <span
            className="flex w-full max-w-10 flex-col-reverse gap-0.5"
            style={{ height: `${Math.max((total / max) * 100, 2)}%` }}
          >
            {segments.map(({ key, color, count }, index) => (
              <span
                key={key}
                className={cn(
                  "min-h-0.5 transition-opacity group-hover:opacity-90",
                  color,
                  index === segments.length - 1 && "rounded-t-[4px]",
                )}
                style={{ flexGrow: count(day) }}
              />
            ))}
          </span>
        )}
      </div>
      <div
        role="tooltip"
        className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-lg border p-2.5 text-xs shadow-md group-focus-within:block group-hover:block"
      >
        <p className="mb-1.5 font-medium">{dayLabel(day.day, "long")}</p>
        {SERIES.map(({ key, label, color, count }) => (
          <p key={key} className="flex items-center gap-1.5 py-0.5">
            <span
              className={cn("size-2 rounded-[2px]", color)}
              aria-hidden="true"
            />
            <span className="text-muted-foreground flex-1">{label}</span>
            <span className="tabular-nums">{formatNumber(count(day))}</span>
          </p>
        ))}
      </div>
    </li>
  );
}

function TrafficChart({
  analytics,
}: {
  analytics: Extract<DashboardAnalytics, { available: true }>;
}) {
  const max = Math.max(1, ...analytics.days.map(totalRequests));

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Legend totals={analytics.totals} />
      <div className="px-5">
        <div className="relative">
          <div
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between text-[10px] tabular-nums"
          >
            <span className="border-border/70 -mt-1.5 border-b border-dashed pb-0.5">
              {formatNumber(max)}
            </span>
            <span className="border-border/70 border-b border-dashed" />
            <span className="border-b" />
          </div>
          <ol className="relative flex h-44 items-end gap-2 pt-4 sm:gap-3">
            {analytics.days.map((day) => (
              <Bar key={day.day} day={day} max={max} />
            ))}
          </ol>
        </div>
        <ol
          aria-hidden="true"
          className="text-muted-foreground mt-2 flex gap-2 text-center text-xs sm:gap-3"
        >
          {analytics.days.map((day) => (
            <li key={day.day} className="flex-1">
              {dayLabel(day.day, "short")}
            </li>
          ))}
        </ol>
      </div>
      {/* A table ignores `sr-only`'s 1px width, so its wrapper takes it. */}
      <div className="sr-only">
        <table>
          <caption>Image requests per day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {SERIES.map(({ key, label }) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analytics.days.map((day) => (
              <tr key={day.day}>
                <th scope="row">{dayLabel(day.day, "long")}</th>
                {SERIES.map(({ key, count }) => (
                  <td key={key}>{count(day)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Unavailable({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground flex flex-1 items-center justify-center px-5 pb-6 text-center text-sm">
      {children}
    </p>
  );
}

export function DashboardTraffic({
  analytics,
  className,
}: {
  analytics: DashboardAnalytics | null;
  className?: string;
}) {
  return (
    <DashboardPanel
      title="Traffic"
      description="Image requests for your websites, last 7 days"
      className={className}
    >
      {!analytics ? (
        <div className="px-5 pb-4">
          <Skeleton className="h-56 w-full" />
        </div>
      ) : analytics.available ? (
        <TrafficChart analytics={analytics} />
      ) : (
        <Unavailable>Traffic data is unavailable right now.</Unavailable>
      )}
    </DashboardPanel>
  );
}

export function DashboardTopPages({
  analytics,
  className,
}: {
  analytics: DashboardAnalytics | null;
  className?: string;
}) {
  const pages = analytics?.available ? analytics.top_pages : [];
  const max = Math.max(1, ...pages.map((page) => page.requests));

  return (
    <DashboardPanel
      title="Top pages"
      description="Most requested images, last 7 days"
      className={className}
    >
      {!analytics ? (
        <div className="flex flex-col gap-2 px-5 pb-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
        </div>
      ) : !analytics.available ? (
        <Unavailable>Traffic data is unavailable right now.</Unavailable>
      ) : pages.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 px-5 pb-6 text-center text-sm">
          <p>No requests yet.</p>
          <p>
            Pages appear here once{" "}
            <Link
              to="/help/$slug"
              params={{ slug: "test-your-social-previews" }}
              className="text-foreground underline underline-offset-4"
            >
              their tags
            </Link>{" "}
            are live.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-1 px-3 pb-3">
          {pages.map((page) => (
            <li
              key={page.page_url}
              className="relative flex items-center gap-3 overflow-hidden rounded-md px-2 py-1.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="bg-chart-1/10 absolute inset-y-0 left-0 rounded-md"
                style={{ width: `${(page.requests / max) * 100}%` }}
              />
              <a
                href={page.page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative min-w-0 flex-1 truncate hover:underline"
              >
                {cleanDisplayUrl(page.page_url)}
              </a>
              <span className="text-muted-foreground relative tabular-nums">
                {formatNumber(page.requests)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </DashboardPanel>
  );
}
