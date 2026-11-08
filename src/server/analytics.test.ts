import { describe, expect, test } from "bun:test";
import { analyticsQueries } from "./analytics";

const since = Date.UTC(2026, 9, 13);
const dataset = "mosaic_og_generations";

describe("analyticsQueries", () => {
  test("passes hostnames as parameters, never in the SQL text", () => {
    const [queries] =
      analyticsQueries(dataset, ["example.com", "www.example.org"], since) ??
      [];
    for (const query of [queries.breakdown, queries.topPages]) {
      expect(query.params).toEqual([
        "2026-10-13T00:00:00.000Z",
        "example.com",
        "www.example.org",
        "example.com",
        "www.example.org",
      ]);
      expect(query.query).not.toContain("example");
    }
  });

  test("matches long hostnames by their 96-byte index and full name", () => {
    const long = `${"a".repeat(90)}.example.com`;
    const [queries] = analyticsQueries(dataset, [long], since) ?? [];
    expect(queries.breakdown.params).toEqual([
      "2026-10-13T00:00:00.000Z",
      long.slice(0, 96),
      long,
    ]);
  });

  test("queries every hostname once, at most 100 per batch", () => {
    const hostnames = Array.from(
      { length: 250 },
      (_, index) => `site-${index}.example.com`,
    );
    const batches = analyticsQueries(dataset, hostnames, since) ?? [];
    // Each batch's params: the window start, every hostname's index, then
    // every full hostname.
    const perBatch = batches.map(({ breakdown }) => {
      const params = breakdown.params as string[];
      return params.slice(1 + (params.length - 1) / 2);
    });
    expect(perBatch.every((batch) => batch.length <= 100)).toBe(true);
    expect(perBatch.flat()).toEqual(hostnames);
  });

  test("refuses a dataset name that isn't a plain identifier", () => {
    expect(analyticsQueries('x" UNION', ["example.com"], since)).toBeNull();
    expect(analyticsQueries(dataset, [], since)).toBeNull();
  });
});
