import type { D1Queryable } from "@/server/db";
import { createTestD1 } from "@/testing/d1";
import type { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import {
  buildImageKey,
  deleteSiteImages,
  deleteStoredImages,
  expirePageImage,
  imageKeyRange,
  latestSiteImages,
  parseImageKey,
} from "./image-store";

let sqlite: Database;
let db: D1Queryable;

beforeEach(async () => {
  ({ db, sqlite } = await createTestD1());
});

function addSite(userId: string, hostname: string): number {
  const site = sqlite
    .query<{ id: number }, [string, string]>(
      "INSERT INTO sites (user_id, url_base) VALUES (?, ?) RETURNING id",
    )
    .get(userId, hostname);
  if (!site) throw new Error(`Failed to add ${hostname}`);
  return site.id;
}

function addImage(hostname: string, path: string, expiresAt = 0) {
  sqlite.run(
    `INSERT INTO global_images
       (page_url, hostname, key, size_in_bytes, generated_at, expires_at)
     VALUES (?, ?, ?, 3, 0, ?)`,
    [
      `https://${hostname}${path}`,
      hostname,
      `global/${hostname}${path}`,
      expiresAt,
    ],
  );
}

function imageHostnames(): string[] {
  return sqlite
    .query<{ hostname: string }, []>(
      "SELECT hostname FROM global_images ORDER BY page_url",
    )
    .all()
    .map(({ hostname }) => hostname);
}

describe("deleteSiteImages", () => {
  test("deletes every image of the user's website and nothing else", async () => {
    const siteId = addSite("user_a", "example.com");
    addSite("user_a", "other.com");
    addImage("example.com", "/");
    addImage("example.com", "/pricing");
    addImage("other.com", "/");

    const deleted = await deleteSiteImages(db, siteId, "user_a");

    expect(deleted?.map(({ page_url }) => page_url).sort()).toEqual([
      "https://example.com/",
      "https://example.com/pricing",
    ]);
    expect(deleted?.map(({ key }) => key).sort()).toEqual([
      "global/example.com/",
      "global/example.com/pricing",
    ]);
    expect(imageHostnames()).toEqual(["other.com"]);
  });

  test("refuses another user's website", async () => {
    const siteId = addSite("user_a", "example.com");
    addImage("example.com", "/");

    expect(await deleteSiteImages(db, siteId, "user_b")).toBeNull();
    expect(imageHostnames()).toEqual(["example.com"]);
  });

  test("returns no images for a website without any", async () => {
    const siteId = addSite("user_a", "example.com");
    expect(await deleteSiteImages(db, siteId, "user_a")).toEqual([]);
  });
});

function expiresAt(pageUrl: string): number | undefined {
  return sqlite
    .query<{ expires_at: number }, [string]>(
      "SELECT expires_at FROM global_images WHERE page_url = ?",
    )
    .get(pageUrl)?.expires_at;
}

describe("expirePageImage", () => {
  const addFreshImage = (hostname: string, path: string) =>
    addImage(hostname, path, 9999999999999);
  const page = (pageUrl: string, hostname: string) => ({ pageUrl, hostname });

  test("expires one page on the user's website and nothing else", async () => {
    addSite("user_a", "example.com");
    addFreshImage("example.com", "/");
    addFreshImage("example.com", "/pricing");

    expect(
      await expirePageImage(
        db,
        page("https://example.com/pricing", "example.com"),
        "user_a",
      ),
    ).toBe(true);
    expect(expiresAt("https://example.com/pricing")).toBe(0);
    expect(expiresAt("https://example.com/")).toBe(9999999999999);
  });

  test("refuses a page on a website the user hasn't saved", async () => {
    addSite("user_a", "example.com");
    addFreshImage("other.com", "/");

    expect(
      await expirePageImage(
        db,
        page("https://other.com/", "other.com"),
        "user_a",
      ),
    ).toBe(false);
    expect(expiresAt("https://other.com/")).toBe(9999999999999);
  });

  test("refuses a page whose hostname doesn't match", async () => {
    addSite("user_a", "example.com");
    addFreshImage("other.com", "/");

    expect(
      await expirePageImage(
        db,
        page("https://other.com/", "example.com"),
        "user_a",
      ),
    ).toBe(false);
    expect(expiresAt("https://other.com/")).toBe(9999999999999);
  });

  test("reports a page without an image", async () => {
    addSite("user_a", "example.com");
    expect(
      await expirePageImage(
        db,
        page("https://example.com/", "example.com"),
        "user_a",
      ),
    ).toBe(false);
  });
});

describe("deleteStoredImages", () => {
  test("deletes keys in batches of at most 1000", async () => {
    const calls: string[][] = [];
    const bucket = {
      delete: async (keys: string[]) => {
        calls.push(keys);
      },
    } as unknown as R2Bucket;
    const keys = Array.from({ length: 2001 }, (_, index) => `key-${index}`);

    await deleteStoredImages(bucket, keys);

    expect(calls.map((batch) => batch.length)).toEqual([1000, 1000, 1]);
    expect(calls.flat()).toEqual(keys);
  });

  test("makes no call without keys", async () => {
    let called = false;
    const bucket = {
      delete: async () => {
        called = true;
      },
    } as unknown as R2Bucket;

    await deleteStoredImages(bucket, []);

    expect(called).toBe(false);
  });
});

describe("latestSiteImages", () => {
  test("lists the user's newest images without query-string pages", async () => {
    addSite("user_a", "example.com");
    addSite("user_b", "other.com");
    addImage("example.com", "/");
    addImage("example.com", "/docs");
    addImage("example.com", "/reset?token=secret");
    addImage("example.com", "/p%3Fq");
    addImage("other.com", "/");
    // Newest last: the reset page is the newest image overall.
    sqlite.run(
      `UPDATE global_images SET generated_at = CASE page_url
         WHEN 'https://example.com/docs' THEN 1
         WHEN 'https://example.com/p%3Fq' THEN 2
         WHEN 'https://example.com/' THEN 3
         ELSE 4 END`,
    );

    const { results } = await latestSiteImages(db, "user_a").all<{
      page_url: string;
      url_base: string;
    }>();
    expect(results).toEqual([
      expect.objectContaining({
        page_url: "https://example.com/",
        url_base: "example.com",
      }),
      expect.objectContaining({ page_url: "https://example.com/p%3Fq" }),
      expect.objectContaining({ page_url: "https://example.com/docs" }),
    ]);
  });
});

const hash = "a".repeat(64);

describe("image keys", () => {
  test("versioned keys round-trip and are immutable", () => {
    const key = buildImageKey(hash, 1_760_000_000_000);
    expect(key).toMatch(/^global\/a{64}-[0-9a-z]+\.jpeg$/);
    expect(parseImageKey(key)).toEqual({ pageHash: hash, immutable: true });
  });

  test("legacy keys parse as mutable", () => {
    expect(parseImageKey(`global/${hash}.jpeg`)).toEqual({
      pageHash: hash,
      immutable: false,
    });
  });

  test("keys under an old per-site prefix parse as mutable", () => {
    for (const key of [
      `msk7vkfb-u4ks6195/${hash}.jpeg`,
      `j57cqpbz24vagv88w6kq1c62zd7xvxzx/${hash}.jpeg`,
      `j57cqpbz24vagv88w6kq1c62zd7xvxzx/${hash}.png`,
    ]) {
      expect(parseImageKey(key)).toEqual({ pageHash: hash, immutable: false });
    }
  });

  test("rejects keys Mosaic does not create", () => {
    for (const key of [
      "global/test.jpeg",
      `global/${hash}-.jpeg`,
      `global/${hash}-ABC.jpeg`,
      `global/${hash}.jpeg/extra`,
      `${hash}.jpeg`,
      `a/b/${hash}.jpeg`,
      `MSK7-U4KS/${hash}.jpeg`,
      `../${hash}.jpeg`,
      `msk7vkfb-u4ks6195/${hash}.webp`,
      `msk7vkfb-u4ks6195/${hash}-abc.jpeg`,
      `${"a".repeat(33)}/${hash}.jpeg`,
    ]) {
      expect(parseImageKey(key)).toBeNull();
    }
  });

  test("the key range covers versioned and legacy keys of one page only", () => {
    const [low, high] = imageKeyRange(hash);
    const inRange = (key: string) => key >= low && key <= high;
    expect(inRange(buildImageKey(hash, 0))).toBe(true);
    expect(inRange(buildImageKey(hash, Number.MAX_SAFE_INTEGER))).toBe(true);
    expect(inRange(`global/${hash}.jpeg`)).toBe(true);
    expect(inRange(buildImageKey("b".repeat(64), 1))).toBe(false);
    expect(inRange(`global/${"a".repeat(63)}b.jpeg`)).toBe(false);
  });
});
