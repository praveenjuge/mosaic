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
