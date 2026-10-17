import { GLOBAL_IMAGE_TTL_MS } from "@/lib/constants";
import type { D1Queryable } from "@/lib/db";
import type { ScreenshotEngine } from "@/lib/types";
import { extractHostname, extractUrlParts } from "@/lib/url";

export type GlobalImage = {
  key: string;
  expiresAt: number;
};

/**
 * The Browser Run engine for a hostname, or `null` when no user has saved it
 * (production generation is only available for saved hostnames). Images are
 * shared by everyone who saved the hostname, so Kitesurf is used only when
 * every one of them chose it.
 */
export async function getHostnameScreenshotEngine(
  db: D1Queryable,
  hostname: string,
): Promise<ScreenshotEngine | null> {
  const normalized = extractHostname(hostname);
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS registrations,
              COALESCE(SUM(screenshot_engine = 'kitesurf'), 0) AS kitesurf
       FROM sites
       WHERE url_base = ?`,
    )
    .bind(normalized)
    .first<{ registrations: number; kitesurf: number }>();
  if (!row?.registrations) return null;
  return row.kitesurf === row.registrations ? "kitesurf" : "chromium";
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
  db: D1Queryable,
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
  db: D1Queryable,
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
  db: D1Queryable,
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
