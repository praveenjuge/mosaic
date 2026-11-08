/**
 * The dashboard's traffic numbers: what `/use` outcomes the analytics
 * dataset holds (`src/server/analytics.ts` writes and queries it), and how
 * they fold into the charts. Shared by the server and the dashboard.
 *
 * Every `/use` request records one event, and so does each screenshot taken
 * in the background (stale refreshes, new sites, regenerations), so totals
 * count image requests plus background screenshots.
 */

import { stripTrailingSlashes } from "@/lib/url";
import { DAY_MS, utcDayStart } from "@/lib/utils";

export type GenerationOutcome =
  | "cache_hit"
  | "stale_hit"
  | "generated"
  | "failed"
  | "rate_limited"
  | "budget_exhausted"
  | "locked"
  | "unregistered";

export const ANALYTICS_DAYS = 7;
export const TOP_PAGES_LIMIT = 8;

/**
 * Midnight UTC on the chart's first day. The queries read from here, so the
 * totals cover exactly the days the chart shows, not a rolling 7 × 24 hours.
 */
export function analyticsWindowStart(now = Date.now()): number {
  return utcDayStart(now) - (ANALYTICS_DAYS - 1) * DAY_MS;
}

/** One `(day, outcome, hostname)` group from the dataset. */
export type AnalyticsRow = {
  day: string;
  outcome: string;
  hostname: string;
  requests: number;
};

export type TopPageRow = { page_url: string; requests: number };

/**
 * A page URL without its query string or fragment. Anyone can save any
 * hostname and see its top pages, so tokens or personal data in a query
 * string must never reach the dashboard. Trailing slashes go too, so the
 * result matches `canonicalPage()` (`https://example.com/?a=1` becomes
 * `https://example.com`).
 */
export function pageUrlWithoutQuery(pageUrl: string): string {
  return stripTrailingSlashes(pageUrl.split(/[?#]/, 1)[0]);
}

export type TrafficCounts = {
  /** Served an existing image, fresh or stale. */
  cached: number;
  /** Took a new screenshot. */
  generated: number;
  /** A screenshot failed or a limit stopped it; an older or example image was served. */
  fallback: number;
};

export type DashboardAnalytics =
  | { available: false }
  | {
      available: true;
      /** Oldest first, one per UTC day, ending today. */
      days: Array<{ day: string } & TrafficCounts>;
      totals: TrafficCounts;
      sites: Record<string, TrafficCounts>;
      top_pages: TopPageRow[];
    };

const OUTCOME_GROUPS: Partial<Record<GenerationOutcome, keyof TrafficCounts>> =
  {
    cache_hit: "cached",
    stale_hit: "cached",
    generated: "generated",
    failed: "fallback",
    rate_limited: "fallback",
    budget_exhausted: "fallback",
    // `locked` waits on another request's screenshot, which records its own
    // event; `unregistered` happened before the site was saved.
  };

const emptyCounts = (): TrafficCounts => ({
  cached: 0,
  generated: 0,
  fallback: 0,
});

/** Every image request in `counts`, whatever answered it. */
export function totalRequests(counts: TrafficCounts): number {
  return counts.cached + counts.generated + counts.fallback;
}

function utcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** Fold dataset rows into per-day, per-site, and overall counts. */
export function summarizeAnalytics(
  rows: AnalyticsRow[],
  topPages: TopPageRow[],
  now = Date.now(),
): DashboardAnalytics {
  const days = new Map<string, TrafficCounts>();
  for (let offset = ANALYTICS_DAYS - 1; offset >= 0; offset--) {
    days.set(utcDay(now - offset * DAY_MS), emptyCounts());
  }
  const totals = emptyCounts();
  // A Map, so a hostname can never collide with an object property.
  const sites = new Map<string, TrafficCounts>();

  for (const row of rows) {
    const group = OUTCOME_GROUPS[row.outcome as GenerationOutcome];
    if (!group) continue;
    const requests = Number(row.requests) || 0;
    // `toStartOfDay` answers "YYYY-MM-DD 00:00:00" (or ISO).
    const day = days.get(String(row.day).slice(0, 10));
    if (day) day[group] += requests;
    totals[group] += requests;
    const site = sites.get(row.hostname) ?? emptyCounts();
    site[group] += requests;
    sites.set(row.hostname, site);
  }

  return {
    available: true,
    days: [...days].map(([day, counts]) => ({ day, ...counts })),
    totals,
    sites: Object.fromEntries(sites),
    top_pages: mergeTopPages(topPages),
  };
}

/**
 * Each batch of hostnames answers its own top pages, and events recorded
 * before `recordGenerationEvent` dropped query strings still carry them, so
 * rows that share a page once the query is gone are added together. Those
 * older rows were ranked per query before the SQL `LIMIT`, so until they
 * leave the window a page split across many queries can count low.
 */
function mergeTopPages(topPages: TopPageRow[]): TopPageRow[] {
  const pages = new Map<string, number>();
  for (const page of topPages) {
    const pageUrl = pageUrlWithoutQuery(page.page_url);
    pages.set(
      pageUrl,
      (pages.get(pageUrl) ?? 0) + (Number(page.requests) || 0),
    );
  }
  return [...pages]
    .map(([page_url, requests]) => ({ page_url, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, TOP_PAGES_LIMIT);
}
