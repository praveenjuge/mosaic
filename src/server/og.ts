import { GLOBAL_IMAGE_TTL_MS } from "@/lib/constants";
import { extractHostname, extractUrlParts } from "@/lib/url";

type D1Queryable = Pick<D1Database, "prepare">;

export type GlobalImage = {
  key: string;
  expiresAt: number;
};

/** Production generation is available only for a hostname saved by a user. */
export async function isHostnameAssociated(
  db: D1Queryable,
  hostname: string,
): Promise<boolean> {
  const normalized = extractHostname(hostname);
  const row = await db
    .prepare("SELECT 1 AS found FROM sites WHERE url_base = ? LIMIT 1")
    .bind(normalized)
    .first<{ found: number }>();
  return row !== null;
}

export async function findGlobalImage(
  db: D1Queryable,
  pageUrl: string,
): Promise<GlobalImage | null> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  const row = await db
    .prepare(
      `SELECT key, expires_at
       FROM global_images
       WHERE page_url = ?`,
    )
    .bind(sanitizedUrl)
    .first<{ key: string; expires_at: number }>();

  return row ? { key: row.key, expiresAt: row.expires_at } : null;
}

export async function acquireGenerationLock(
  db: D1Database,
  pageUrl: string,
): Promise<string | null> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
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
    .bind(sanitizedUrl, leaseToken, now + 60_000, now)
    .first<{ lease_token: string }>();
  return result?.lease_token ?? null;
}

export async function releaseGenerationLock(
  db: D1Database,
  pageUrl: string,
  leaseToken: string,
): Promise<void> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  await db
    .prepare(
      `DELETE FROM generation_locks
       WHERE page_url = ? AND lease_token = ?`,
    )
    .bind(sanitizedUrl, leaseToken)
    .run();
}

export async function recordGlobalImage(
  db: D1Database,
  imageKey: string,
  pageUrl: string,
  imageSize: number,
): Promise<void> {
  const { sanitizedUrl, urlBase } = extractUrlParts(pageUrl);
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
      sanitizedUrl,
      urlBase,
      imageKey,
      imageSize,
      now,
      now + GLOBAL_IMAGE_TTL_MS,
    )
    .run();
}
