import { describe, expect, test } from "bun:test";
import { analyticsQueries, summarizeAnalytics } from "./site-analytics";

describe("analyticsQueries", () => {
  test("passes hostnames as parameters, never in the SQL text", () => {
    const queries = analyticsQueries("mosaic_og_generations", [
      "example.com",
      "www.example.org",
    ]);
    expect(queries?.breakdown.params).toEqual([
      "example.com",
      "www.example.org",
      "example.com",
      "www.example.org",
    ]);
    expect(queries?.breakdown.query).toContain("index1 IN ($1, $2)");
    // A look-alike hostname sharing the 96-byte index must not match.
    expect(queries?.breakdown.query).toContain("blob2 IN ($3, $4)");
    expect(queries?.topPages.query).toContain("blob2 IN ($3, $4)");
    expect(queries?.breakdown.query).toContain(
      'FROM events.analyticsEngine."mosaic_og_generations"',
    );
    expect(queries?.breakdown.query).not.toContain("example.com");
    expect(queries?.topPages.query).toContain("LIMIT 8");
  });

  test("skips hostnames that aren't stored hostnames", () => {
    const queries = analyticsQueries("mosaic_og_generations", [
      "example.com",
      "x') OR 1=1 --",
    ]);
    expect(queries?.breakdown.params).toEqual(["example.com", "example.com"]);
  });

  test("refuses a dataset name that isn't a plain identifier", () => {
    expect(analyticsQueries('x" UNION', ["example.com"])).toBeNull();
    expect(analyticsQueries("mosaic_og_generations", [])).toBeNull();
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

  test("answers zeros without traffic", () => {
    const summary = summarizeAnalytics([], [], now);
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.totals).toEqual({ cached: 0, generated: 0, fallback: 0 });
    expect(summary.days.every((day) => day.cached === 0)).toBe(true);
  });
});
