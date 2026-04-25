/**
 * D1 query helpers for the /use OG image generation endpoint.
 *
 * These are plain async functions (not server functions) that accept
 * a D1Database parameter. They are called directly from the /use
 * route handler which already has access to env.DB.
 */

import { IMAGES_LIMIT } from "@/lib/constants";
import type { SiteSummary } from "@/lib/types";
import { extractUrlParts, normalizeUrlBase } from "@/lib/url";

export type { SiteSummary };

// ── getSitesForUrlBase ──────────────────────────────────────────────

/**
 * Find all sites matching a given URL base and select the first site
 * whose owner hasn't exceeded the global image limit.
 *
 * Uses a single query with a correlated subquery to fetch per-user
 * image totals, avoiding N+1 sequential D1 round-trips.
 */
export async function getSitesForUrlBase(
  db: D1Database,
  urlBase: string,
): Promise<{ sites: SiteSummary[]; selectedSite: SiteSummary | null }> {
  const normalizedUrlBase = normalizeUrlBase(urlBase);

  const matchingSites = await db
    .prepare(
      `SELECT s.id, s.user_id, s.url_base, s.r2_prefix,
              (SELECT COALESCE(SUM(image_count), 0)
                 FROM sites
                WHERE user_id = s.user_id) AS user_total
         FROM sites s
        WHERE s.url_base = ?
        ORDER BY s.created_at ASC`,
    )
    .bind(normalizedUrlBase)
    .all<{
      id: number;
      user_id: string;
      url_base: string;
      r2_prefix: string;
      user_total: number;
    }>();

  if (matchingSites.results.length === 0) {
    return { sites: [], selectedSite: null };
  }

  const sites: SiteSummary[] = matchingSites.results.map((row) => ({
    siteId: row.id,
    url_base: row.url_base,
    r2Prefix: row.r2_prefix,
  }));

  // Pick the first site whose owner is under the image limit
  let selectedSite: SiteSummary | null = null;
  for (const row of matchingSites.results) {
    if (row.user_total < IMAGES_LIMIT) {
      selectedSite = {
        siteId: row.id,
        url_base: row.url_base,
        r2Prefix: row.r2_prefix,
      };
      break;
    }
  }

  return { sites, selectedSite };
}

// ── findCachedImageKey ───────────────────────────────────────────────

/**
 * Look up an existing image record in D1 by page URL and site IDs.
 * Returns the R2 key if a cached image exists, null otherwise.
 * This avoids multiple R2 HEAD requests by checking D1 first.
 */
export async function findCachedImageKey(
  db: D1Database,
  pageUrl: string,
  siteIds: number[],
): Promise<string | null> {
  if (siteIds.length === 0) return null;

  const { sanitizedUrl } = extractUrlParts(pageUrl);
  const placeholders = siteIds.map(() => "?").join(", ");

  const result = await db
    .prepare(
      `SELECT key FROM images
       WHERE page_url = ? AND site_id IN (${placeholders})
       LIMIT 1`,
    )
    .bind(sanitizedUrl, ...siteIds)
    .first<{ key: string }>();

  return result?.key ?? null;
}

// ── recordImage ─────────────────────────────────────────────────────

/**
 * Insert an image record into the images table and increment the
 * site's image_count in a single batched D1 call. This reduces
 * two sequential round trips to one.
 */
export async function recordImage(
  db: D1Database,
  siteId: number,
  imageKey: string,
  pageUrl: string,
  imageSize: number,
): Promise<void> {
  const { sanitizedUrl } = extractUrlParts(pageUrl);
  const now = Date.now();

  await db.batch([
    db
      .prepare(
        `INSERT INTO images (site_id, key, page_url, size_in_bytes, generated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(siteId, imageKey, sanitizedUrl, imageSize, now),
    db
      .prepare(`UPDATE sites SET image_count = image_count + 1 WHERE id = ?`)
      .bind(siteId),
  ]);
}
