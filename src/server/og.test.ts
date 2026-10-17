import type { D1Queryable } from "@/lib/db";
import type { ScreenshotEngine } from "@/lib/types";
import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getHostnameScreenshotEngine } from "./og";

const migrationsDir = join(import.meta.dir, "../../migrations");

let sqlite: Database;

// Just enough of D1's prepared-statement API, backed by the real migrations
// in SQLite, to exercise the SQL in these helpers.
const db = {
  prepare: (sql: string) => ({
    bind: (...params: unknown[]) => ({
      first: async () => sqlite.query(sql).get(...(params as string[])) ?? null,
    }),
  }),
} as unknown as D1Queryable;

function addSite(userId: string, urlBase: string, engine?: ScreenshotEngine) {
  sqlite
    .query(
      engine
        ? "INSERT INTO sites (user_id, url_base, r2_prefix, screenshot_engine) VALUES (?, ?, ?, ?)"
        : "INSERT INTO sites (user_id, url_base, r2_prefix) VALUES (?, ?, ?)",
    )
    .run(userId, urlBase, `${userId}/${urlBase}`, ...(engine ? [engine] : []));
}

beforeEach(() => {
  sqlite = new Database(":memory:");
  for (const file of readdirSync(migrationsDir).sort()) {
    sqlite.run(readFileSync(join(migrationsDir, file), "utf8"));
  }
});

describe("getHostnameScreenshotEngine", () => {
  test("returns null for a hostname nobody saved", async () => {
    expect(await getHostnameScreenshotEngine(db, "example.com")).toBeNull();
  });

  test("defaults saved sites to Chromium", async () => {
    addSite("user_a", "example.com");
    expect(await getHostnameScreenshotEngine(db, "example.com")).toBe(
      "chromium",
    );
  });

  test("uses Kitesurf when every user who saved the hostname chose it", async () => {
    addSite("user_a", "example.com", "kitesurf");
    addSite("user_b", "example.com", "kitesurf");
    addSite("user_c", "other.example", "chromium");
    expect(await getHostnameScreenshotEngine(db, "example.com")).toBe(
      "kitesurf",
    );
  });

  test("keeps Chromium while any user who saved the hostname wants it", async () => {
    addSite("user_a", "example.com", "kitesurf");
    addSite("user_b", "example.com", "chromium");
    expect(await getHostnameScreenshotEngine(db, "example.com")).toBe(
      "chromium",
    );
  });

  test("rejects unknown engines at the database", () => {
    expect(() =>
      addSite("user_a", "example.com", "webkit" as ScreenshotEngine),
    ).toThrow(/CHECK constraint failed/);
  });
});
