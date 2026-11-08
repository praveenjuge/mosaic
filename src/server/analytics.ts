/**
 * The `/use` outcomes dataset in Workers Analytics Engine
 * (`mosaic_og_generations`): one event per production `/use` outcome,
 * written through `OG_ANALYTICS` and read back for the dashboard through the
 * `ANALYTICS_SQL` binding. Columns: index1 = hostname (cut to 96 bytes),
 * blob1 = outcome, blob2 = hostname, blob3 = page URL without its query
 * string (older events may have none, or still carry one), double1 =
 * durationMs, double2 = bytes.
 *
 * Local Analytics Engine accepts writes but has no SQL API, so dev keeps its
 * own events in memory (`src/server/local-analytics.ts`) and reads those.
 *
 * @see https://developers.cloudflare.com/analytics/analytics-engine/
 */

import {
  analyticsWindowStart,
  pageUrlWithoutQuery,
  summarizeAnalytics,
  TOP_PAGES_LIMIT,
  type AnalyticsRow,
  type DashboardAnalytics,
  type GenerationOutcome,
  type TopPageRow,
} from "@/lib/site-analytics";
import { queryLocalEvents, recordLocalEvent } from "@/server/local-analytics";
import { env } from "cloudflare:workers";

/** Analytics Engine keeps the first 96 bytes of an index. */
const INDEX_LENGTH = 96;
/** Per query, which keeps it well under the SQL API's 10 KiB statement. */
const MAX_HOSTNAMES = 100;
/** Hostname batches (two queries each) queried at once. */
const BATCH_CONCURRENCY = 5;

interface GenerationEvent {
  outcome: GenerationOutcome;
  hostname: string;
  /** The canonical page URL the request asked for; stored without its query. */
  pageUrl: string;
  /** Screenshot plus upload time, for `generated` and `failed`. */
  durationMs?: number;
  /** Stored image size, for `generated`. */
  bytes?: number;
}

/**
 * Record one production `/use` outcome. `writeDataPoint` doesn't block;
 * failures are logged and never affect the response.
 */
export function recordGenerationEvent({
  outcome,
  hostname,
  pageUrl,
  durationMs = 0,
  bytes = 0,
}: GenerationEvent) {
  // Query strings can hold tokens or personal data, and anyone who saves a
  // hostname sees its top pages.
  const page = pageUrlWithoutQuery(pageUrl);
  if (import.meta.env.DEV) {
    recordLocalEvent({ outcome, hostname, pageUrl: page });
  }
  try {
    env.OG_ANALYTICS.writeDataPoint({
      indexes: [hostname.slice(0, INDEX_LENGTH)],
      // A data point's blobs share a size limit; an oversized one would
      // drop the whole event.
      blobs: [outcome, hostname, page.slice(0, 2048)],
      doubles: [durationMs, bytes],
    });
  } catch (error) {
    console.error("[ANALYTICS] Failed to record generation event:", error);
  }
}

function datasetIdentifier(name: string): string | null {
  return /^[A-Za-z0-9_]+$/.test(name) ? `"${name}"` : null;
}

type AnalyticsQueries = {
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
  since: number,
): AnalyticsQueries[] | null {
  const table = datasetIdentifier(dataset);
  const unique = [...new Set(hostnames.filter(Boolean))];
  if (!table || unique.length === 0) return null;

  const batches: AnalyticsQueries[] = [];
  for (let start = 0; start < unique.length; start += MAX_HOSTNAMES) {
    const batch = unique.slice(start, start + MAX_HOSTNAMES);
    // `$1` is the window start; hostnames follow.
    const placeholders = (offset: number) =>
      batch.map((_, index) => `$${offset + index + 2}`).join(", ");
    const where = `timestamp >= $1
      AND index1 IN (${placeholders(0)})
      AND blob2 IN (${placeholders(batch.length)})`;
    const params = [
      new Date(since).toISOString(),
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

/**
 * Traffic for the given hostnames over the chart's days, or
 * `{ available: false }` when the SQL API fails.
 */
export async function querySiteAnalytics(
  hostnames: string[],
): Promise<DashboardAnalytics> {
  const since = analyticsWindowStart();
  if (import.meta.env.DEV) {
    const { rows, topPages } = queryLocalEvents(
      hostnames,
      since,
      TOP_PAGES_LIMIT,
    );
    return summarizeAnalytics(rows, topPages);
  }

  if (!datasetIdentifier(env.OG_ANALYTICS_DATASET)) {
    console.error("[ANALYTICS] OG_ANALYTICS_DATASET is not a dataset name");
    return { available: false };
  }
  const batches = analyticsQueries(env.OG_ANALYTICS_DATASET, hostnames, since);
  if (!batches) return summarizeAnalytics([], []);
  try {
    // A few batches at a time stays inside the SQL API's concurrency limit.
    const results = [];
    for (let start = 0; start < batches.length; start += BATCH_CONCURRENCY) {
      results.push(
        ...(await Promise.all(
          batches
            .slice(start, start + BATCH_CONCURRENCY)
            .map(({ breakdown, topPages }) =>
              Promise.all([
                env.ANALYTICS_SQL.query<AnalyticsRow>(breakdown),
                env.ANALYTICS_SQL.query<TopPageRow>(topPages),
              ]),
            ),
        )),
      );
    }
    return summarizeAnalytics(
      results.flatMap(([breakdown]) => breakdown.data),
      results.flatMap(([, topPages]) => topPages.data),
    );
  } catch (error) {
    console.error("[ANALYTICS] Failed to query site analytics:", error);
    return { available: false };
  }
}
