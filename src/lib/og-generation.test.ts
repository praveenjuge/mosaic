import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

// `generateImage` runs against Cloudflare bindings and D1 helpers; these
// stand-ins record what it does. The integration harness can't screenshot,
// so this is where the success path is covered. Bun's module mocks apply to
// the whole test run, so only modules no other test imports are mocked; the
// page fetch goes through a stubbed `fetch` instead.
type Image = { key: string; expiresAt: number };

const state = {
  current: null as Image | null,
  lockFree: true,
  screenshot: async (): Promise<ArrayBuffer> => new ArrayBuffer(3),
  calls: [] as string[],
  bucket: new Map<string, ArrayBuffer>(),
};

mock.module("cloudflare:workers", () => ({
  env: {
    SITE_RATE_LIMITER: { limit: async () => ({ success: true }) },
    OG_BUCKET: {
      put: async (key: string, value: ArrayBuffer) => {
        state.calls.push(`put ${key}`);
        state.bucket.set(key, value);
      },
      delete: async (key: string) => {
        state.calls.push(`delete ${key}`);
        state.bucket.delete(key);
      },
    },
  },
  waitUntil: () => {},
}));
mock.module("@/lib/analytics", () => ({ recordGenerationEvent: () => {} }));
mock.module("@/lib/screenshot", () => ({
  takeScreenshot: () => {
    state.calls.push("screenshot");
    return state.screenshot();
  },
}));
mock.module("@/server/generation-usage", () => ({
  reserveGeneration: async () => true,
}));
mock.module("@/server/og", () => ({
  acquireGenerationLock: async () => (state.lockFree ? "lease" : null),
  releaseGenerationLock: async () => {
    state.calls.push("release");
  },
  findGlobalImage: async () => state.current,
  isHostnameAssociated: async () => true,
  recordGlobalImage: async (_db: unknown, _page: unknown, key: string) => {
    state.calls.push(`record ${key}`);
    state.current = { key, expiresAt: Date.now() + 1000 };
  },
}));

const { generateImage } = await import("./og-generation");

const target = {
  url: new URL("https://example.com"),
  pageUrl: "https://example.com",
  hostname: "example.com",
  requestHostname: "mosaic.example",
};
const db = {} as Parameters<typeof generateImage>[0];
const oldKey = `global/${"a".repeat(64)}-1.jpeg`;

const realFetch = globalThis.fetch;
globalThis.fetch = (async () =>
  new Response("<html></html>", { status: 200 })) as unknown as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  state.current = { key: oldKey, expiresAt: Date.now() - 1 };
  state.lockFree = true;
  state.screenshot = async () => new ArrayBuffer(3);
  state.calls = [];
  state.bucket = new Map([[oldKey, new ArrayBuffer(1)]]);
});

describe("generateImage", () => {
  test("stores a new versioned key, then deletes the replaced one", async () => {
    const result = await generateImage(db, target, "client");

    expect("key" in result && result.key).toMatch(
      /^global\/[0-9a-f]{64}-[0-9a-z]+\.jpeg$/,
    );
    const key = (result as { key: string }).key;
    expect(key).not.toBe(oldKey);
    expect(state.calls).toEqual([
      "screenshot",
      `put ${key}`,
      `record ${key}`,
      `delete ${oldKey}`,
      "release",
    ]);
    expect([...state.bucket.keys()]).toEqual([key]);
  });

  test("returns an image refreshed by another request without a screenshot", async () => {
    state.current = { key: oldKey, expiresAt: Date.now() + 60_000 };

    expect(await generateImage(db, target, "client")).toEqual({ key: oldKey });
    expect(state.calls).toEqual(["release"]);
  });

  test("skips while another request holds the lock", async () => {
    state.lockFree = false;

    expect(await generateImage(db, target, "client")).toEqual({
      skipped: "locked",
    });
    expect(state.calls).toEqual([]);
  });

  test("keeps the old image and releases the lock when the screenshot fails", async () => {
    state.screenshot = async () => {
      throw new Error("Browser Run is down");
    };

    expect(await generateImage(db, target, "client")).toEqual({
      skipped: "failed",
    });
    expect(state.calls).toEqual(["screenshot", "release"]);
    expect([...state.bucket.keys()]).toEqual([oldKey]);
  });
});
