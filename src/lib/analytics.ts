import type { ScreenshotEngine } from "@/lib/types";
import { env } from "cloudflare:workers";

export type GenerationOutcome =
  | "cache_hit"
  | "generated"
  | "failed"
  | "rate_limited"
  | "budget_exhausted"
  | "locked"
  | "unregistered";

interface GenerationEvent {
  outcome: GenerationOutcome;
  hostname: string;
  /** Screenshot plus upload time, for `generated` and `failed`. */
  durationMs?: number;
  /** Stored image size, for `generated`. */
  bytes?: number;
  /** Browser Run engine used, for `generated` and `failed`. */
  engine?: ScreenshotEngine;
}

/**
 * Records one production `/use` outcome in Workers Analytics Engine
 * (dataset `mosaic_og_generations`). Columns: index1 = hostname,
 * blob1 = outcome, blob2 = hostname, blob3 = engine (empty when no screenshot
 * ran), double1 = durationMs, double2 = bytes.
 *
 * `writeDataPoint` is non-blocking; failures are logged and never affect
 * the response.
 *
 * @see https://developers.cloudflare.com/analytics/analytics-engine/
 */
export function recordGenerationEvent({
  outcome,
  hostname,
  durationMs = 0,
  bytes = 0,
  engine,
}: GenerationEvent) {
  try {
    env.OG_ANALYTICS.writeDataPoint({
      // Index values are limited to 96 bytes.
      indexes: [hostname.slice(0, 96)],
      blobs: [outcome, hostname, engine ?? ""],
      doubles: [durationMs, bytes],
    });
  } catch (error) {
    console.error("[ANALYTICS] Failed to record generation event:", error);
  }
}
