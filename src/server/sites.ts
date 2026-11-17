import type { Site } from "@/lib/types";
import { getDb } from "@/server/db";
import {
  regeneratePage,
  resetSiteImages,
  resolveTarget,
  siteSaved,
  type GenerationResult,
} from "@/server/generation";
import { authMiddleware } from "@/server/middleware";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const siteId = z.number().int().positive();
const urlInput = z.string().trim().min(1).max(2048);
const DUPLICATE_SITE = "This website already exists in your list.";

/** The hostname to store for a website the user typed. */
function publicHostname(value: string): string {
  const target = resolveTarget(value, getRequest().url);
  if ("error" in target) throw new Error(target.error);
  return target.hostname;
}

export const addSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ url_base: urlInput }))
  .handler(async ({ context, data }): Promise<Site> => {
    // The unique (user_id, url_base) index turns a duplicate into no row.
    const site = await getDb()
      .prepare(
        `INSERT INTO sites (user_id, url_base) VALUES (?, ?)
         ON CONFLICT DO NOTHING
         RETURNING *`,
      )
      .bind(context.userId, publicHostname(data.url_base))
      .first<Site>();
    if (!site) throw new Error(DUPLICATE_SITE);
    siteSaved(site.url_base, getRequest().url, context.userId);
    return site;
  });

export const editSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ siteId, url_base: urlInput }))
  .handler(async ({ context, data }): Promise<Site> => {
    const db = getDb();
    const site = await db
      .prepare(
        `UPDATE OR IGNORE sites SET url_base = ?
         WHERE id = ? AND user_id = ?
         RETURNING *`,
      )
      .bind(publicHostname(data.url_base), data.siteId, context.userId)
      .first<Site>();
    if (site) {
      siteSaved(site.url_base, getRequest().url, context.userId);
      return site;
    }

    // No row: either the site isn't this user's, or the new hostname is
    // already in their list (the unique index ignored the update).
    const owned = await db
      .prepare("SELECT 1 FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first();
    throw new Error(
      owned ? DUPLICATE_SITE : "Website not found or access denied.",
    );
  });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ siteId }))
  .handler(async ({ context, data }): Promise<void> => {
    const result = await getDb()
      .prepare("DELETE FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .run();
    if (result.meta.changes === 0) throw new Error("Website not found.");
  });

/** Delete every image of the website; see `resetSiteImages`. */
export const regenerateSiteImages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ siteId }))
  .handler(async ({ context, data }): Promise<{ deleted: number }> => {
    const deleted = await resetSiteImages(
      data.siteId,
      context.userId,
      getRequest().url,
    );
    if (deleted === null) throw new Error("Website not found.");
    return { deleted };
  });

/** Screenshot one page of the user's websites now; see `regeneratePage`. */
export const regeneratePageImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pageUrl: urlInput }))
  .handler(({ context, data }): Promise<GenerationResult> =>
    regeneratePage(data.pageUrl, getRequest().url, context.userId),
  );
