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
  const row = await db
    .prepare(
      `SELECT key, expires_at
       FROM global_images
       WHERE page_url = ?`,
    )
    .bind(pageUrl)
    .first<{ key: string; expires_at: number }>();

  return row ? { key: row.key, expiresAt: row.expires_at } : null;
}

export async function acquireGenerationLock(
  db: D1Queryable,
  pageUrl: string,
): Promise<string | null> {
  const now = Date.now();
  const leaseToken = crypto.randomUUID();
  const result = await db
    .prepare(
      `INSERT INTO generation_locks (page_url, lease_token, expires_at)
       VALUES (?, ?, ?)
       ON CONFLICT(page_url) DO UPDATE SET
         lease_token = excluded.lease_token,
         expires_at = excluded.expires_at
       WHERE generation_locks.expires_at < ?
       RETURNING lease_token`,
    )
    .bind(pageUrl, leaseToken, now + 60_000, now)
    .first<{ lease_token: string }>();
  return result?.lease_token ?? null;
}

export async function releaseGenerationLock(
  db: D1Queryable,
  pageUrl: string,
  leaseToken: string,
): Promise<void> {
  await db
    .prepare(
      `DELETE FROM generation_locks
       WHERE page_url = ? AND lease_token = ?`,
    )
    .bind(pageUrl, leaseToken)
    .run();
}

export async function recordGlobalImage(
  db: D1Queryable,
  page: { pageUrl: string; hostname: string },
  imageKey: string,
  imageSize: number,
): Promise<void> {
  const now = Date.now();
  await db
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
    )
    .run();
}
