import { getDb } from "@/lib/db";
import { forgetUnregisteredHostname, warmSiteImage } from "@/lib/og-generation";
import type { Site } from "@/lib/types";
import { parseWebsiteUrl, validateOutboundUrl } from "@/lib/url";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { waitUntil } from "cloudflare:workers";
import { z } from "zod";
import { authMiddleware } from "./middleware";

function normalizePublicHostname(value: string): string {
  const websiteUrl = parseWebsiteUrl(value);
  const error = validateOutboundUrl(websiteUrl);
  if (error) throw new Error(error);
  return websiteUrl.hostname;
}

/**
 * Screenshot a newly saved website's home page after the response, so the
 * first social crawler finds an image ready. Runs behind the same rate limit,
 * lock, and daily budget as `/use`, counted against the user. Also clears
 * this colo's cached "not registered" answer for the hostname.
 */
function warmAfterResponse(hostname: string, userId: string) {
  const requestUrl = getRequest().url;
  waitUntil(
    forgetUnregisteredHostname(requestUrl, hostname).catch((error) =>
      console.error("[SITES] Failed to clear cached /use answer:", error),
    ),
  );
  waitUntil(warmSiteImage(hostname, requestUrl, `user:${userId}`));
}

const addSiteSchema = z.object({
  url_base: z.string().trim().min(1).max(2048),
});

export const addSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(addSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    // The unique (user_id, url_base) index turns a duplicate into no row.
    const site = await getDb()
      .prepare(
        `INSERT INTO sites (user_id, url_base) VALUES (?, ?)
         ON CONFLICT DO NOTHING
         RETURNING *`,
      )
      .bind(context.userId, normalizePublicHostname(data.url_base))
      .first<Site>();
    if (!site) throw new Error("This website already exists in your list.");
    warmAfterResponse(site.url_base, context.userId);
    return site;
  });

const editSiteSchema = z.object({
  siteId: z.number().int().positive(),
  url_base: z.string().trim().min(1).max(2048),
});

export const editSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(editSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const db = getDb();
    const site = await db
      .prepare(
        `UPDATE OR IGNORE sites SET url_base = ?
         WHERE id = ? AND user_id = ?
         RETURNING *`,
      )
      .bind(normalizePublicHostname(data.url_base), data.siteId, context.userId)
      .first<Site>();
    if (site) {
      warmAfterResponse(site.url_base, context.userId);
      return site;
    }

    // No row: either the site isn't this user's, or the new hostname is
    // already in their list (the unique index ignored the update).
    const owned = await db
      .prepare("SELECT 1 FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first();
    throw new Error(
      owned
        ? "This website already exists in your list."
        : "Website not found or access denied.",
    );
  });

const deleteSiteSchema = z.object({ siteId: z.number().int().positive() });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(deleteSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const result = await getDb()
      .prepare("DELETE FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .run();
    if (result.meta.changes === 0) throw new Error("Website not found.");
  });
