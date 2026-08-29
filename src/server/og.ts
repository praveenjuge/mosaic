/**
 * D1 query helpers for the /use OG image generation endpoint.
 *
 * These are plain async functions (not server functions) that accept
 * a D1Database or D1DatabaseSession parameter. They are called directly
 * from the /use route handler which already has access to env.DB.
 */

import type { SiteSummary } from "@/lib/types";
import { extractHostname, extractUrlParts } from "@/lib/url";

export type { SiteSummary };

/** Accepts either a full D1Database or a read-only D1DatabaseSession. */
type D1Queryable = Pick<D1Database, "prepare" | "batch">;

// ── getSiteForUrlBase ───────────────────────────────────────────────

/**
 * Find the single verified owner for a hostname.
 */
export async function getSiteForUrlBase(
  db: D1Queryable,
  urlBase: string,
): Promise<SiteSummary | null> {
  const normalizedUrlBase = extractHostname(urlBase);

  const row = await db
    .prepare(
      `SELECT id, user_id, url_base, r2_prefix, generation_secret
       FROM sites
       WHERE url_base = ? AND verified_at IS NOT NULL
       LIMIT 1`,
    )
    .bind(normalizedUrlBase)
    .first<{
      id: number;
      user_id: string;
      url_base: string;
      r2_prefix: string;
      generation_secret: string;
    }>();

  if (!row?.generation_secret) return null;
  return {
    siteId: row.id,
    userId: row.user_id,
    url_base: row.url_base,
    r2Prefix: row.r2_prefix,
    generationSecret: row.generation_secret,
  };
}

// ── findCachedImageKey ───────────────────────────────────────────────

/**
 * Look up an existing image record in D1 by page URL and site IDs.
 * Returns the R2 key if a cached image exists, null otherwise.
 * This avoids multiple R2 HEAD requests by checking D1 first.
 */
export async function findCachedImageKey(
  db: D1Queryable,
  pageUrl: string,
  siteId: number,
): Promise<string | null> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);

  const result = await db
    .prepare(
      `SELECT key FROM images
       WHERE page_url = ? AND site_id = ?
       LIMIT 1`,
    )
    .bind(sanitizedUrl, siteId)
    .first<{ key: string }>();

  return result?.key ?? null;
}

export async function acquireGenerationLock(
  db: D1Database,
  siteId: number,
  pageUrl: string,
): Promise<string | null> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  const now = Date.now();
  const leaseToken = crypto.randomUUID();
  const result = await db
    .prepare(
      `INSERT INTO generation_locks
         (site_id, page_url, lease_token, expires_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(site_id, page_url) DO UPDATE SET
         lease_token = excluded.lease_token,
         expires_at = excluded.expires_at
       WHERE generation_locks.expires_at < ?
       RETURNING lease_token`,
    )
    .bind(siteId, sanitizedUrl, leaseToken, now + 60_000, now)
    .first<{ lease_token: string }>();
  return result?.lease_token ?? null;
}

export async function releaseGenerationLock(
  db: D1Database,
  siteId: number,
  pageUrl: string,
  leaseToken: string,
): Promise<void> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  await db
    .prepare(
      `DELETE FROM generation_locks
       WHERE site_id = ? AND page_url = ? AND lease_token = ?`,
    )
    .bind(siteId, sanitizedUrl, leaseToken)
    .run();
}

// ── recordImage ─────────────────────────────────────────────────────

/**
 * Insert an image record and increment the stored-image count. Returns false
 * when another concurrent request already recorded the same canonical URL.
 */
export async function recordImage(
  db: D1Database,
  siteId: number,
  imageKey: string,
  pageUrl: string,
  imageSize: number,
): Promise<boolean> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  const now = Date.now();

  const [insertResult] = await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO images
           (site_id, key, page_url, size_in_bytes, generated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(siteId, imageKey, sanitizedUrl, imageSize, now),
    db
      .prepare(
        `UPDATE sites
         SET image_count = image_count + 1
         WHERE id = ? AND changes() = 1`,
      )
      .bind(siteId),
  ]);

  return insertResult.meta.changes === 1;
}
