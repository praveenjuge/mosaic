import type { D1Queryable } from "@/lib/db";

/**
 * Delete every image of one of the user's websites, so each page is
 * screenshotted again on its next `/use` request. Returns the deleted
 * images, or `null` when the site isn't the user's. The images are shared by
 * everyone who saved the hostname, so this resets them for all of them.
 */
export async function deleteSiteImages(
  db: D1Queryable,
  siteId: number,
  userId: string,
): Promise<{ key: string; page_url: string }[] | null> {
  const [site, deleted] = await db.batch([
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
  return (deleted as D1Result<{ key: string; page_url: string }>).results;
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

/** R2 deletes at most 1000 keys per call. */
const R2_DELETE_BATCH = 1000;

export function deleteStoredImages(
  bucket: R2Bucket,
  keys: string[],
): Promise<void> {
  const batches: string[][] = [];
  for (let start = 0; start < keys.length; start += R2_DELETE_BATCH) {
    batches.push(keys.slice(start, start + R2_DELETE_BATCH));
  }
  return Promise.all(batches.map((batch) => bucket.delete(batch))).then(
    () => undefined,
  );
}

/**
 * Mark one page's image expired, so the next screenshot replaces it while
 * the old one keeps serving. Only touches pages on one of the user's
 * websites. Returns whether the page had an image to expire.
 */
export async function expirePageImage(
  db: D1Queryable,
  pageUrl: string,
  hostname: string,
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
    .bind(pageUrl, hostname, userId, hostname)
    .first();
  return Boolean(expired);
}
