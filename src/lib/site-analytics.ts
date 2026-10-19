/**
 * The dashboard's traffic numbers, read back from the `OG_ANALYTICS`
 * Analytics Engine dataset (written by `src/lib/analytics.ts`) through the
 * `ANALYTICS_SQL` binding (`getDashboardAnalytics` in `src/server/stats.ts`).
 * In dev, `src/lib/local-analytics.ts` stands in.
 *
 * Every `/use` request records one event, and so does each screenshot taken
 * in the background (stale refreshes, new sites, regenerations), so totals
 * count image requests plus background screenshots.
 */

import type { GenerationOutcome } from "@/lib/analytics";

export const ANALYTICS_DAYS = 7;
export const TOP_PAGES_LIMIT = 8;
/** Per query, which keeps it well under the SQL API's 10 KiB statement. */
const MAX_HOSTNAMES = 100;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** One `(day, outcome, hostname)` group from the dataset. */
export type AnalyticsRow = {
  day: string;
  outcome: string;
  hostname: string;
  requests: number;
};

export type TopPageRow = { page_url: string; requests: number };

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

/** Analytics Engine keeps the first 96 bytes of an index (`analytics.ts`). */
const INDEX_LENGTH = 96;

function datasetIdentifier(name: string): string | null {
  return /^[A-Za-z0-9_]+$/.test(name) ? `"${name}"` : null;
}

export type AnalyticsQueries = {
  breakdown: AnalyticsSQLQuery;
  topPages: AnalyticsSQLQuery;
};

/**
 * The SQL the dashboard runs, one pair of statements per batch of
 * `MAX_HOSTNAMES` hostnames, so every saved website is counted. Hostnames
 * are positional parameters, never SQL text. `index1` holds a hostname cut
 * to 96 bytes, which a longer look-alike can share, so the full hostname in
 * `blob2` must match too. Analytics Engine applies sample weights to
 * `COUNT` itself.
 */
export function analyticsQueries(
  dataset: string,
  hostnames: string[],
): AnalyticsQueries[] | null {
  const table = datasetIdentifier(dataset);
  const unique = [...new Set(hostnames.filter(Boolean))];
  if (!table || unique.length === 0) return null;

  const batches: AnalyticsQueries[] = [];
  for (let start = 0; start < unique.length; start += MAX_HOSTNAMES) {
    const batch = unique.slice(start, start + MAX_HOSTNAMES);
    const placeholders = (offset: number) =>
      batch.map((_, index) => `$${offset + index + 1}`).join(", ");
    const where = `timestamp >= NOW() - INTERVAL '${ANALYTICS_DAYS}' DAY
      AND index1 IN (${placeholders(0)})
      AND blob2 IN (${placeholders(batch.length)})`;
    const params = [
      ...batch.map((hostname) => hostname.slice(0, INDEX_LENGTH)),
      ...batch,
    ];

    batches.push({
      breakdown: {
        query: `SELECT toStartOfDay(timestamp) AS day, blob1 AS outcome,
          blob2 AS hostname, COUNT(*) AS requests
        FROM events.analyticsEngine.${table}
        WHERE ${where}
        GROUP BY day, outcome, hostname`,
        params,
      },
      topPages: {
        query: `SELECT blob3 AS page_url, COUNT(*) AS requests
        FROM events.analyticsEngine.${table}
        WHERE ${where} AND blob3 != '' AND blob1 != 'unregistered'
        GROUP BY page_url
        ORDER BY requests DESC
        LIMIT ${TOP_PAGES_LIMIT}`,
        params,
      },
    });
  }
  return batches;
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
    // Each batch of hostnames answers its own top pages.
    top_pages: topPages
      .map((page) => ({
        page_url: page.page_url,
        requests: Number(page.requests) || 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, TOP_PAGES_LIMIT),
  };
}
