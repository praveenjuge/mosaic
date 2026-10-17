import { describe, expect, test } from "bun:test";
import { buildDashboardStats } from "./dashboard";

describe("dashboard image stats", () => {
  test("totals per-site image counts and trims latest page URLs", () => {
    const stats = buildDashboardStats(
      [
        {
          id: 1,
          url_base: "example.com",
          created_at: "2026-08-29 10:00:00",
          image_count: 2,
          last_generated_at: 1_788_000_000_000,
        },
        {
          id: 2,
          url_base: "empty.example",
          created_at: "2026-08-29 09:00:00",
          image_count: 0,
          last_generated_at: null,
        },
      ],
      [
        {
          key: "global/example.jpeg",
          page_url: "https://example.com/page/",
          size_in_bytes: 12_345,
          generated_at: 1_788_000_000_000,
          url_base: "example.com",
        },
      ],
    );

    expect(stats.total_websites).toBe(2);
    expect(stats.total_images).toBe(2);
    expect(stats.latest_screenshots).toEqual([
      {
        key: "global/example.jpeg",
        page_url: "https://example.com/page",
        size_in_bytes: 12_345,
        generated_at: 1_788_000_000_000,
        url_base: "example.com",
      },
    ]);
  });
});
