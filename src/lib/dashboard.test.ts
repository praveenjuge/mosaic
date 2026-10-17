import { describe, expect, test } from "bun:test";
import { buildDashboardStats } from "./dashboard";

describe("dashboard image stats", () => {
  test("restores shared cached images for the user's associated websites", () => {
    const stats = buildDashboardStats(
      [
        {
          id: 1,
          url_base: "example.com",
          created_at: "2026-08-29 10:00:00",
        },
        {
          id: 2,
          url_base: "empty.example",
          created_at: "2026-08-29 09:00:00",
        },
      ],
      [
        {
          hostname: "example.com",
          image_count: 2,
          last_generated_at: 1_788_000_000_000,
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

    expect(stats.total_images).toBe(2);
    expect(stats.websites[0]).toMatchObject({
      image_count: 2,
      last_generated_at: 1_788_000_000_000,
    });
    expect(stats.websites[1]).toMatchObject({
      image_count: 0,
      last_generated_at: null,
    });
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
