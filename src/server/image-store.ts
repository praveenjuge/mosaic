/**
 * Where shared OG images live: R2 objects under versioned keys, and one
 * `global_images` row per page naming its current key. Every helper takes
 * the canonical `pageUrl` and `hostname` from `canonicalPage()` in
 * src/lib/url.ts.
 *
 * Each screenshot of a page gets a new key,
 * `global/<sha256(pageUrl)>-<version>.jpeg`, so the content at a key never
 * changes and `/i/<key>` can be cached for good. Keys from before versioning
 * were overwritten in place: `global/<sha256(pageUrl)>.jpeg`, and before that
 * `<r2Prefix>/<sha256(pageUrl)>.jpeg` (or `.png`) under a per-site prefix such
 * as `msk7vkfb-u4ks6195` or a 32-character Convex ID.
 */

import { GLOBAL_IMAGE_TTL_MS } from "@/lib/constants";
import type { D1Queryable } from "@/server/db";

// ── Keys ────────────────────────────────────────────────────────────

const VERSIONED_KEY = /^global\/([0-9a-f]{64})-[0-9a-z]+\.jpeg$/;
const LEGACY_KEY =
  /^[0-9a-z]{1,32}(?:-[0-9a-z]{1,32})?\/([0-9a-f]{64})\.(?:jpeg|png)$/;

export function buildImageKey(pageHash: string, version: number): string {
  return `global/${pageHash}-${version.toString(36)}.jpeg`;
}

/**
 * The page hash of a shared image key, and whether the key is versioned
 * (immutable). `null` for keys Mosaic doesn't create.
 */
export function parseImageKey(
  key: string,
): { pageHash: string; immutable: boolean } | null {
  const versioned = VERSIONED_KEY.exec(key);
  if (versioned) return { pageHash: versioned[1], immutable: true };
  const legacy = LEGACY_KEY.exec(key);
  if (legacy) return { pageHash: legacy[1], immutable: false };
  return null;
}

/**
 * The inclusive key range holding every image of one page: versioned keys
 * (`<hash>-…`) sort before the legacy key (`<hash>.jpeg`) because "-" < ".".
 */
export function imageKeyRange(pageHash: string): [string, string] {
  return [`global/${pageHash}-`, `global/${pageHash}.jpeg`];
}

// ── Images ──────────────────────────────────────────────────────────

export type GlobalImage = {
  key: string;
  expiresAt: number;
};

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

function findGlobalImageStatement(db: D1Queryable, pageUrl: string) {
  return db
    .prepare(
      `SELECT key, expires_at AS expiresAt
       FROM global_images
       WHERE page_url = ?`,
    )
    .bind(pageUrl);
}

export function findGlobalImage(
  db: D1Queryable,
  pageUrl: string,
): Promise<GlobalImage | null> {
  return findGlobalImageStatement(db, pageUrl).first<GlobalImage>();
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

// ── Generation locks ────────────────────────────────────────────────

/**
 * How long a generation lock holds without being released: the backstop if
 * the Worker is stopped mid-screenshot.
 */
export const GENERATION_LOCK_LEASE_MS = 60_000;

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
              g.expires_at AS expiresAt,
              EXISTS (
                SELECT 1 FROM generation_locks
                WHERE page_url = ?1 AND expires_at >= ?2
              ) AS locked
       FROM (SELECT 1) AS one
       LEFT JOIN global_images g ON g.page_url = ?1`,
    )
    .bind(pageUrl, Date.now())
    .first<{ key: string | null; expiresAt: number | null; locked: number }>();
  return {
    image:
      row?.key != null && row.expiresAt != null
        ? { key: row.key, expiresAt: row.expiresAt }
        : null,
    locked: Boolean(row?.locked),
  };
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
  const [lock, image] = await db.batch<GlobalImage>([
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
      .bind(pageUrl, leaseToken, now + GENERATION_LOCK_LEASE_MS, now),
    findGlobalImageStatement(db, pageUrl),
  ]);
  if (lock.results.length === 0) return null;
  return { leaseToken, current: image.results.at(0) ?? null };
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

// ── A user's websites ───────────────────────────────────────────────

/**
 * Delete every image row of one of the user's websites. Returns the deleted
 * images, or `null` when the site isn't the user's. The images are shared by
 * everyone who saved the hostname, so this resets them for all of them.
 */
export async function deleteSiteImages(
  db: D1Queryable,
  siteId: number,
  userId: string,
): Promise<{ key: string; page_url: string }[] | null> {
  const [site, deleted] = await db.batch<{ key: string; page_url: string }>([
    db
      .prepare("SELECT 1 AS found FROM sites WHERE id = ? AND user_id = ?")
      .bind(siteId, userId),
    db
      .prepare(
        `DELETE FROM global_images
         WHERE hostname = (
           SELECT url_base FROM sites WHERE id = ? AND user_id = ?
         )
         RETURNING key, page_url`,
      )
      .bind(siteId, userId),
  ]);
  if (site.results.length === 0) return null;
  return deleted.results;
}

/**
 * The newest images across the user's websites, for the dashboard. Anyone
 * can save any hostname, so pages with a query string are left out: their
 * URL and screenshot can hold tokens or personal data. A canonical page URL
 * only has a `?` in its query, since one in the path is percent-encoded.
 * Reads images through the (hostname, generated_at) index.
 */
export function latestSiteImages(db: D1Queryable, userId: string) {
  return db
    .prepare(
      `SELECT g.key,
              g.page_url,
              g.size_in_bytes,
              g.generated_at,
              g.hostname AS url_base
       FROM global_images g
       JOIN sites s ON s.url_base = g.hostname
       WHERE s.user_id = ? AND instr(g.page_url, '?') = 0
       ORDER BY g.generated_at DESC
       LIMIT 12`,
    )
    .bind(userId);
}

/**
 * Mark one page's image expired, so the next screenshot replaces it while
 * the old one keeps serving. Only touches pages on one of the user's
 * websites. Returns whether the page had an image to expire.
 */
export async function expirePageImage(
  db: D1Queryable,
  page: { pageUrl: string; hostname: string },
  userId: string,
): Promise<boolean> {
  const expired = await db
    .prepare(
      `UPDATE global_images SET expires_at = 0
       WHERE page_url = ? AND hostname = ?
         AND EXISTS (
           SELECT 1 FROM sites WHERE user_id = ? AND url_base = ?
         )
       RETURNING page_url`,
    )
    .bind(page.pageUrl, page.hostname, userId, page.hostname)
    .first();
  return Boolean(expired);
}

/** R2 deletes at most 1000 keys per call. */
const R2_DELETE_BATCH = 1000;

export async function deleteStoredImages(
  bucket: R2Bucket,
  keys: string[],
): Promise<void> {
  const batches: string[][] = [];
  for (let start = 0; start < keys.length; start += R2_DELETE_BATCH) {
    batches.push(keys.slice(start, start + R2_DELETE_BATCH));
  }
  await Promise.all(batches.map((batch) => bucket.delete(batch)));
}
