import { describe, expect, test } from "bun:test";
import {
  analyticsQueries,
  analyticsWindowStart,
  summarizeAnalytics,
} from "./site-analytics";

const since = Date.UTC(2026, 9, 13);
const sinceIso = "2026-10-13T00:00:00.000Z";

describe("analyticsQueries", () => {
  test("passes hostnames as parameters, never in the SQL text", () => {
    const [queries] =
      analyticsQueries(
        "mosaic_og_generations",
        ["example.com", "www.example.org"],
        since,
      ) ?? [];
    expect(queries.breakdown.params).toEqual([
      sinceIso,
      "example.com",
      "www.example.org",
      "example.com",
      "www.example.org",
    ]);
    expect(queries.breakdown.query).toContain("timestamp >= $1");
    expect(queries.breakdown.query).toContain("index1 IN ($2, $3)");
    // A look-alike hostname sharing the 96-byte index must not match.
    expect(queries.breakdown.query).toContain("blob2 IN ($4, $5)");
    expect(queries.topPages.query).toContain("blob2 IN ($4, $5)");
    expect(queries.breakdown.query).toContain(
      'FROM events.analyticsEngine."mosaic_og_generations"',
    );
    expect(queries.breakdown.query).not.toContain("example.com");
    expect(queries.topPages.query).toContain("LIMIT 8");
  });

  test("matches long hostnames by their 96-byte index and full name", () => {
    const long = `${"a".repeat(90)}.example.com`;
    const [queries] =
      analyticsQueries(
        "mosaic_og_generations",
        [long, "[2001:db8::1]"],
        since,
      ) ?? [];
    expect(queries.breakdown.params).toEqual([
      sinceIso,
      long.slice(0, 96),
      "[2001:db8::1]",
      long,
      "[2001:db8::1]",
    ]);
  });

  test("queries every hostname, 100 per batch", () => {
    const hostnames = Array.from(
      { length: 250 },
      (_, index) => `site-${index}.example.com`,
    );
    const batches =
      analyticsQueries("mosaic_og_generations", hostnames, since) ?? [];
    expect(batches.map(({ breakdown }) => breakdown.params?.length)).toEqual([
      201, 201, 101,
    ]);
    const lastParams = batches[2].breakdown.params as string[];
    expect(lastParams.at(-1)).toBe("site-249.example.com");
  });

  test("refuses a dataset name that isn't a plain identifier", () => {
    expect(analyticsQueries('x" UNION', ["example.com"], since)).toBeNull();
    expect(analyticsQueries("mosaic_og_generations", [], since)).toBeNull();
  });
});

describe("analyticsWindowStart", () => {
  test("starts at midnight UTC on the chart's first day", () => {
    const now = Date.UTC(2026, 9, 19, 12);
    expect(analyticsWindowStart(now)).toBe(since);
    // The chart's first bar is the same day.
    const summary = summarizeAnalytics([], [], now);
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.days[0].day).toBe("2026-10-13");
  });
});

describe("summarizeAnalytics", () => {
  const now = Date.UTC(2026, 9, 19, 12);

  test("groups outcomes per day and per site, oldest day first", () => {
    const summary = summarizeAnalytics(
      [
        {
          day: "2026-10-19 00:00:00",
          outcome: "cache_hit",
          hostname: "example.com",
          requests: 40,
        },
        {
          day: "2026-10-19 00:00:00",
          outcome: "stale_hit",
          hostname: "example.com",
          requests: 2,
        },
        {
          day: "2026-10-18 00:00:00",
          outcome: "generated",
          hostname: "other.com",
          requests: 3,
        },
        {
          day: "2026-10-17 00:00:00",
          outcome: "budget_exhausted",
          hostname: "other.com",
          // The SQL API can answer large counts as strings.
          requests: "1" as unknown as number,
        },
        {
          day: "2026-10-19 00:00:00",
          outcome: "unregistered",
          hostname: "example.com",
          requests: 9,
        },
      ],
      [{ page_url: "https://example.com", requests: 42 }],
      now,
    );

    if (!summary.available) throw new Error("expected analytics");
    expect(summary.days).toHaveLength(7);
    expect(summary.days[0].day).toBe("2026-10-13");
    expect(summary.days.at(-1)).toEqual({
      day: "2026-10-19",
      cached: 42,
      generated: 0,
      fallback: 0,
    });
    expect(summary.totals).toEqual({ cached: 42, generated: 3, fallback: 1 });
    expect(summary.sites["other.com"]).toEqual({
      cached: 0,
      generated: 3,
      fallback: 1,
    });
    expect(summary.top_pages).toEqual([
      { page_url: "https://example.com", requests: 42 },
    ]);
  });

  test("merges each batch's top pages into one list", () => {
    const summary = summarizeAnalytics(
      [],
      Array.from({ length: 12 }, (_, index) => ({
        page_url: `https://example.com/${index}`,
        requests: index,
      })),
      now,
    );
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.top_pages).toHaveLength(8);
    expect(summary.top_pages[0]).toEqual({
      page_url: "https://example.com/11",
      requests: 11,
    });
  });

  test("answers zeros without traffic", () => {
    const summary = summarizeAnalytics([], [], now);
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.totals).toEqual({ cached: 0, generated: 0, fallback: 0 });
    expect(summary.days.every((day) => day.cached === 0)).toBe(true);
  });
});
