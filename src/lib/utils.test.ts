import { describe, expect, test } from "bun:test";
import { formatDate } from "./utils";

describe("date formatting", () => {
  test("uses the same timezone during SSR and browser hydration", () => {
    expect(formatDate(1_788_000_000_000)).toBe("Aug 29, 2026, 4:10:00 PM");
  });
});
