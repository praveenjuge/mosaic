import type { D1Queryable } from "@/lib/db";
import { Database, type SQLQueryBindings } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { deleteSiteImages, deleteStoredImages } from "./site-images";

/** Just enough of D1 over bun:sqlite to run these helpers' SQL. */
function createD1(sqlite: Database): D1Queryable {
  const statement = (sql: string, params: SQLQueryBindings[] = []) => ({
    sql,
    params,
    bind: (...values: SQLQueryBindings[]) => statement(sql, values),
    all: async () => ({ results: sqlite.query(sql).all(...params) }),
    first: async () => sqlite.query(sql).get(...params),
    run: async () => ({ meta: { changes: sqlite.run(sql, params).changes } }),
  });
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) =>
      sqlite.transaction(() =>
        statements.map(({ sql, params }) => ({
          results: sqlite.query(sql).all(...params),
        })),
      )(),
  } as unknown as D1Queryable;
}

let sqlite: Database;
let db: D1Queryable;

const migrationsDir = join(import.meta.dir, "../../migrations");
const migrationFiles = [
  ...new Bun.Glob("*.sql").scanSync({ cwd: migrationsDir }),
].sort();

beforeEach(async () => {
  sqlite = new Database(":memory:");
  for (const file of migrationFiles) {
    sqlite.exec(await Bun.file(join(migrationsDir, file)).text());
  }
  db = createD1(sqlite);
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

function addImage(hostname: string, path: string) {
  sqlite.run(
    `INSERT INTO global_images
       (page_url, hostname, key, size_in_bytes, generated_at, expires_at)
     VALUES (?, ?, ?, 3, 0, 0)`,
    [`https://${hostname}${path}`, hostname, `global/${hostname}${path}`],
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
