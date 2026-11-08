import { utcDayStart } from "@/lib/utils";
import { DAILY_GENERATION_LIMITS } from "@/server/generation-usage";
import { createTestD1 } from "@/testing/d1";
import {
  resetWorkerRuntime,
  settleBackgroundWork,
  testEnv,
} from "@/testing/worker-runtime";
import type { Database } from "bun:sqlite";
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  generateImage,
  regeneratePage,
  resolveTarget,
  type Target,
} from "./generation";

// The integration harness can't screenshot, so this is where the success
// path is covered: real D1 queries over bun:sqlite, and stand-ins for
// Browser Run, R2, and the rate limiter.

const requestUrl = "https://mosaic.example/dashboard";
const oldKey = `global/${"a".repeat(64)}-1.jpeg`;

let db: Awaited<ReturnType<typeof createTestD1>>["db"];
let sqlite: Database;
let bucket: Map<string, ArrayBuffer>;
let screenshots: number;
let screenshotStatus: number;
let fetchSignal: AbortSignal | null;
let rateLimited: boolean;

const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: string, init?: RequestInit) => {
  fetchSignal = init?.signal ?? null;
  return new Response("<html></html>", { status: 200 });
}) as unknown as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

beforeEach(async () => {
  resetWorkerRuntime();
  ({ db, sqlite } = await createTestD1());
  bucket = new Map([[oldKey, new ArrayBuffer(1)]]);
  screenshots = 0;
  screenshotStatus = 200;
  fetchSignal = null;
  rateLimited = false;
  Object.assign(testEnv, {
    DB: db,
    SITE_RATE_LIMITER: { limit: async () => ({ success: !rateLimited }) },
    OG_ANALYTICS: { writeDataPoint: () => {} },
    BROWSER: {
      quickAction: async () => {
        screenshots++;
        return new Response(new Uint8Array([1, 2, 3]), {
          status: screenshotStatus,
        });
      },
    },
    OG_BUCKET: {
      put: async (key: string, value: ArrayBuffer) => {
        bucket.set(key, value);
        return { httpEtag: '"etag"' };
      },
      delete: async (key: string) => {
        bucket.delete(key);
      },
    },
  });
});

function target(): Target {
  const resolved = resolveTarget("example.com", requestUrl);
  if ("error" in resolved) throw new Error(resolved.error);
  return resolved;
}

function addSite(userId: string, hostname: string) {
  sqlite.run("INSERT INTO sites (user_id, url_base) VALUES (?, ?)", [
    userId,
    hostname,
  ]);
}

function addOldImage(expiresAt: number) {
  sqlite.run(
    `INSERT INTO global_images
       (page_url, hostname, key, size_in_bytes, generated_at, expires_at)
     VALUES ('https://example.com', 'example.com', ?, 1, 0, ?)`,
    [oldKey, expiresAt],
  );
}

const storedKey = () =>
  (
    sqlite
      .query("SELECT key FROM global_images WHERE page_url = ?")
      .get("https://example.com") as { key: string } | null
  )?.key;

const lockCount = () =>
  (
    sqlite.query("SELECT COUNT(*) AS n FROM generation_locks").get() as {
      n: number;
    }
  ).n;

describe("generateImage", () => {
  test("stores a new versioned image and deletes the one it replaces", async () => {
    addOldImage(Date.now() - 1);

    const result = await generateImage(db, target(), "client");
    await settleBackgroundWork();

    expect(result.status).toBe("ready");
    const key = (result as { key: string }).key;
    expect(key).toMatch(/^global\/[0-9a-f]{64}-[0-9a-z]+\.jpeg$/);
    expect(storedKey()).toBe(key);
    expect([...bucket.keys()]).toEqual([key]);
    expect(lockCount()).toBe(0);
    const cached = await (
      await caches.open("mosaic:images")
    ).match(new Request(`https://mosaic.example/i/${key}`));
    expect(cached?.headers.get("Cache-Control")).toContain("immutable");
  });

  test("returns an image another request just refreshed, without a screenshot", async () => {
    addOldImage(Date.now() + 60_000);

    expect(await generateImage(db, target(), "client")).toEqual({
      status: "ready",
      key: oldKey,
    });
    expect(screenshots).toBe(0);
    expect(lockCount()).toBe(0);
  });

  test("cancels the page fetch and keeps the old image when the budget is spent", async () => {
    addOldImage(Date.now() - 1);
    sqlite.run(
      `INSERT INTO generation_budgets (scope, budget_key, window_start, count)
       VALUES ('production-client', 'client', ?, ?)`,
      [utcDayStart(), DAILY_GENERATION_LIMITS.production.client],
    );

    expect(await generateImage(db, target(), "client")).toEqual({
      status: "budget_exhausted",
    });
    expect(fetchSignal?.aborted).toBe(true);
    expect(screenshots).toBe(0);
    expect(storedKey()).toBe(oldKey);
    expect(lockCount()).toBe(0);
  });

  test("skips while another request holds the lock", async () => {
    sqlite.run(
      `INSERT INTO generation_locks (page_url, lease_token, expires_at)
       VALUES ('https://example.com', 'other', ?)`,
      [Date.now() + 60_000],
    );

    expect(await generateImage(db, target(), "client")).toEqual({
      status: "locked",
    });
    expect(screenshots).toBe(0);
    expect(lockCount()).toBe(1);
  });

  test("skips a rate-limited client before taking the lock", async () => {
    rateLimited = true;

    expect(await generateImage(db, target(), "client")).toEqual({
      status: "rate_limited",
    });
    expect(lockCount()).toBe(0);
  });

  test("keeps the old image and releases the lock when the screenshot fails", async () => {
    addOldImage(Date.now() - 1);
    screenshotStatus = 400;

    expect(await generateImage(db, target(), "client")).toEqual({
      status: "failed",
    });
    expect(storedKey()).toBe(oldKey);
    expect([...bucket.keys()]).toEqual([oldKey]);
    expect(lockCount()).toBe(0);
  });
});

describe("regeneratePage", () => {
  test("replaces a fresh image of the user's page right away", async () => {
    addSite("user_a", "example.com");
    addOldImage(Date.now() + 60_000);

    const result = await regeneratePage(
      "https://example.com/",
      requestUrl,
      "user_a",
    );

    expect(result.status).toBe("ready");
    expect(storedKey()).not.toBe(oldKey);
    expect(screenshots).toBe(1);
  });

  test("refuses a page on a website the user hasn't saved", async () => {
    addSite("user_b", "example.com");
    addOldImage(Date.now() + 60_000);

    await expect(
      regeneratePage("https://example.com/", requestUrl, "user_a"),
    ).rejects.toThrow("Image not found.");
    expect(storedKey()).toBe(oldKey);
    expect(screenshots).toBe(0);
  });
});
