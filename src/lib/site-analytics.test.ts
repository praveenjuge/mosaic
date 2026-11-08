import { describe, expect, test } from "bun:test";
import {
  analyticsWindowStart,
  pageUrlWithoutQuery,
  summarizeAnalytics,
} from "./site-analytics";

const since = Date.UTC(2026, 9, 13);

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

describe("pageUrlWithoutQuery", () => {
  test("matches the canonical page once the query is gone", () => {
    expect(pageUrlWithoutQuery("https://example.com/?utm_source=x")).toBe(
      "https://example.com",
    );
    expect(pageUrlWithoutQuery("https://example.com/a/?token=secret")).toBe(
      "https://example.com/a",
    );
    expect(pageUrlWithoutQuery("https://example.com/a#top")).toBe(
      "https://example.com/a",
    );
    expect(pageUrlWithoutQuery("https://example.com/p%3Fq?x=1")).toBe(
      "https://example.com/p%3Fq",
    );
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

  test("drops query strings and fragments from top pages", () => {
    const summary = summarizeAnalytics(
      [],
      [
        { page_url: "https://example.com/reset?token=secret", requests: 3 },
        { page_url: "https://example.com/reset", requests: 2 },
        { page_url: "https://example.com/docs#intro", requests: 4 },
        { page_url: "https://example.com/?utm_source=x", requests: 1 },
        { page_url: "https://example.com", requests: 1 },
      ],
      now,
    );
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.top_pages).toEqual([
      { page_url: "https://example.com/reset", requests: 5 },
      { page_url: "https://example.com/docs", requests: 4 },
      { page_url: "https://example.com", requests: 2 },
    ]);
  });

  test("answers zeros without traffic", () => {
    const summary = summarizeAnalytics([], [], now);
    if (!summary.available) throw new Error("expected analytics");
    expect(summary.totals).toEqual({ cached: 0, generated: 0, fallback: 0 });
    expect(summary.days.every((day) => day.cached === 0)).toBe(true);
  });
});
