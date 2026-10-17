import { GLOBAL_IMAGE_TTL_MS } from "@/lib/constants";
import type { D1Queryable } from "@/lib/db";

export type GlobalImage = {
  key: string;
  expiresAt: number;
};

// Every helper takes the canonical `pageUrl` and `hostname` from
// `canonicalPage()` in src/lib/url.ts.

/** Production generation is available only for a hostname saved by a user. */
export async function isHostnameAssociated(
  db: D1Queryable,
  hostname: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS found FROM sites WHERE url_base = ? LIMIT 1")
    .bind(hostname)
    .first<{ found: number }>();
  return row !== null;
}

export async function findGlobalImage(
  db: D1Queryable,
  pageUrl: string,
): Promise<GlobalImage | null> {
  const row = await findGlobalImageStatement(db, pageUrl).first<{
    key: string;
    expires_at: number;
  }>();

  return row ? { key: row.key, expiresAt: row.expires_at } : null;
}

/**
 * A page's image, and whether a request still holds its generation lock.
 * Read by requests waiting for another request's first screenshot.
 */
export async function findGlobalImageOrLock(
  db: D1Queryable,
  pageUrl: string,
): Promise<{ image: GlobalImage | null; locked: boolean }> {
  const row = await db
    .prepare(
      `SELECT g.key,
              g.expires_at,
              EXISTS (
                SELECT 1 FROM generation_locks
                WHERE page_url = ?1 AND expires_at >= ?2
              ) AS locked
       FROM (SELECT 1) AS one
       LEFT JOIN global_images g ON g.page_url = ?1`,
    )
    .bind(pageUrl, Date.now())
    .first<{ key: string | null; expires_at: number | null; locked: number }>();
  return {
    image:
      row?.key != null && row.expires_at != null
        ? { key: row.key, expiresAt: row.expires_at }
        : null,
    locked: Boolean(row?.locked),
  };
}

/** The current image key of the page whose images fall in `keyRange`. */
export async function findImageKeyInRange(
  db: D1Queryable,
  [low, high]: [string, string],
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT key FROM global_images
       WHERE key >= ? AND key <= ?
       LIMIT 1`,
    )
    .bind(low, high)
    .first<{ key: string }>();
  return row?.key ?? null;
}

function findGlobalImageStatement(db: D1Queryable, pageUrl: string) {
  return db
    .prepare(
      `SELECT key, expires_at
       FROM global_images
       WHERE page_url = ?`,
    )
    .bind(pageUrl);
}

function releaseLockStatement(
  db: D1Queryable,
  pageUrl: string,
  leaseToken: string,
) {
  return db
    .prepare(
      `DELETE FROM generation_locks
       WHERE page_url = ? AND lease_token = ?`,
    )
    .bind(pageUrl, leaseToken);
}

/**
 * Take the page's generation lock and, in the same round trip, read its
 * current image: another request may have just refreshed it, or a replica
 * may have served an older row before the lock's write. `null` while another
 * request holds the lock.
 */
export async function acquireGenerationLock(
  db: D1Queryable,
  pageUrl: string,
): Promise<{ leaseToken: string; current: GlobalImage | null } | null> {
  const now = Date.now();
  const leaseToken = crypto.randomUUID();
  const [lock, image] = await db.batch([
    db
      .prepare(
        `INSERT INTO generation_locks (page_url, lease_token, expires_at)
         VALUES (?, ?, ?)
         ON CONFLICT(page_url) DO UPDATE SET
           lease_token = excluded.lease_token,
           expires_at = excluded.expires_at
         WHERE generation_locks.expires_at < ?
         RETURNING lease_token`,
      )
      .bind(pageUrl, leaseToken, now + 60_000, now),
    findGlobalImageStatement(db, pageUrl),
  ]);
  if (lock.results.length === 0) return null;
  const row = (image as D1Result<{ key: string; expires_at: number }>)
    .results[0];
  return {
    leaseToken,
    current: row ? { key: row.key, expiresAt: row.expires_at } : null,
  };
}

export async function releaseGenerationLock(
  db: D1Queryable,
  pageUrl: string,
  leaseToken: string,
): Promise<void> {
  await releaseLockStatement(db, pageUrl, leaseToken).run();
}

/**
 * Record a page's new image and release its generation lock in one
 * transaction, so a successful generation costs one round trip here.
 */
export async function recordGlobalImageAndRelease(
  db: D1Queryable,
  page: { pageUrl: string; hostname: string },
  imageKey: string,
  imageSize: number,
  leaseToken: string,
): Promise<void> {
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO global_images
           (page_url, hostname, key, size_in_bytes, generated_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(page_url) DO UPDATE SET
           hostname = excluded.hostname,
           key = excluded.key,
           size_in_bytes = excluded.size_in_bytes,
           generated_at = excluded.generated_at,
           expires_at = excluded.expires_at`,
      )
      .bind(
        page.pageUrl,
        page.hostname,
        imageKey,
        imageSize,
        now,
        now + GLOBAL_IMAGE_TTL_MS,
      ),
    releaseLockStatement(db, page.pageUrl, leaseToken),
  ]);
}
