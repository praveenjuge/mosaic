/**
 * Dev-only stand-in for querying Workers Analytics Engine. Local Analytics
 * Engine accepts `writeDataPoint` but has no SQL API, so in `bun run dev`
 * `recordGenerationEvent` also keeps each event here, in the Worker's memory,
 * and the dashboard reads the same rows the SQL API would return. Every call
 * is behind `import.meta.env.DEV`, so production builds drop it.
 */

import type { AnalyticsRow, TopPageRow } from "@/lib/site-analytics";

type LocalEvent = {
  timestamp: number;
  outcome: string;
  hostname: string;
  pageUrl: string;
};

/** Enough for a dev session; the oldest events go first. */
const MAX_EVENTS = 10_000;
const events: LocalEvent[] = [];

export function recordLocalEvent(event: Omit<LocalEvent, "timestamp">) {
  events.push({ ...event, timestamp: Date.now() });
  if (events.length > MAX_EVENTS) events.shift();
}

function dayLabel(timestamp: number): string {
  return `${new Date(timestamp).toISOString().slice(0, 10)} 00:00:00`;
}

function sumBy<T extends string>(
  keys: Iterable<T>,
): Array<{ key: T; requests: number }> {
  const totals = new Map<T, number>();
  for (const key of keys) totals.set(key, (totals.get(key) ?? 0) + 1);
  return [...totals].map(([key, requests]) => ({ key, requests }));
}

/** The rows `analyticsQueries` asks Analytics Engine for. */
export function queryLocalEvents(
  hostnames: string[],
  since: number,
  topPagesLimit: number,
): { rows: AnalyticsRow[]; topPages: TopPageRow[] } {
  const wanted = new Set(hostnames);
  const matching = events.filter(
    (event) => event.timestamp >= since && wanted.has(event.hostname),
  );
  const rows = sumBy(
    matching.map((event) =>
      JSON.stringify([
        dayLabel(event.timestamp),
        event.outcome,
        event.hostname,
      ]),
    ),
  ).map(({ key, requests }) => {
    const [day, outcome, hostname] = JSON.parse(key) as string[];
    return { day, outcome, hostname, requests };
  });
  const topPages = sumBy(
    matching
      .filter((event) => event.outcome !== "unregistered")
      .map((event) => event.pageUrl),
  )
    .sort((a, b) => b.requests - a.requests)
    .slice(0, topPagesLimit)
    .map(({ key, requests }) => ({ page_url: key, requests }));
  return { rows, topPages };
}
