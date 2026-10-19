import { recordLocalEvent } from "@/lib/local-analytics";
import { pageUrlWithoutQuery } from "@/lib/site-analytics";
import { env } from "cloudflare:workers";

export type GenerationOutcome =
  | "cache_hit"
  | "stale_hit"
  | "generated"
  | "failed"
  | "rate_limited"
  | "budget_exhausted"
  | "locked"
  | "unregistered";

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
 * Records one production `/use` outcome in Workers Analytics Engine
 * (dataset `mosaic_og_generations`). Columns: index1 = hostname,
 * blob1 = outcome, blob2 = hostname, blob3 = page URL without its query string
 * (older events may have none, or still carry one), double1 = durationMs, double2 = bytes. The dashboard
 * reads them back through `src/lib/site-analytics.ts`.
 *
 * `writeDataPoint` is non-blocking; failures are logged and never affect
 * the response.
 *
 * @see https://developers.cloudflare.com/analytics/analytics-engine/
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
  // Local Analytics Engine accepts writes but can't be queried.
  if (import.meta.env.DEV) {
    recordLocalEvent({ outcome, hostname, pageUrl: page });
  }
  try {
    env.OG_ANALYTICS.writeDataPoint({
      // Index values are limited to 96 bytes.
      indexes: [hostname.slice(0, 96)],
      // A data point's blobs share a size limit; an oversized one would
      // drop the whole event.
      blobs: [outcome, hostname, page.slice(0, 2048)],
      doubles: [durationMs, bytes],
    });
  } catch (error) {
    console.error("[ANALYTICS] Failed to record generation event:", error);
  }
}
