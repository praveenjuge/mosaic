import { describe, expect, test } from "bun:test";
import { formatBytes, formatDate, formatRelativeTime } from "./utils";

describe("date formatting", () => {
  test("uses the same timezone during SSR and browser hydration", () => {
    expect(formatDate(1_788_000_000_000)).toBe("Aug 29, 2026, 4:10:00 PM");
  });

  test("formats recent times relative to now", () => {
    const now = 1_788_000_000_000;
    expect(formatRelativeTime(now - 10_000, now)).toBe("just now");
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5m ago");
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(formatRelativeTime(now - 12 * 86_400_000, now)).toBe("12d ago");
  });
});

describe("byte formatting", () => {
  test("picks a readable unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(152_000)).toBe("148 KB");
    expect(formatBytes(2_621_440)).toBe("2.5 MB");
  });
});
