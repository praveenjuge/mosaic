import { getDb } from "@/lib/db";
import type { Site } from "@/lib/types";
import { parseWebsiteUrl, validateOutboundUrl } from "@/lib/url";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "./middleware";

function generateR2Prefix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePublicHostname(value: string): string {
  const websiteUrl = parseWebsiteUrl(value);
  const error = validateOutboundUrl(websiteUrl);
  if (error) throw new Error(error);
  return websiteUrl.hostname;
}

const addSiteSchema = z.object({
  url_base: z.string().trim().min(1).max(2048),
});

export const addSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(addSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const hostname = normalizePublicHostname(data.url_base);
    const db = getDb();
    const existing = await db
      .prepare("SELECT id FROM sites WHERE user_id = ? AND url_base = ?")
      .bind(context.userId, hostname)
      .first<{ id: number }>();
    if (existing) throw new Error("This website already exists in your list.");

    const insert = await db
      .prepare(
        `INSERT INTO sites (user_id, url_base, image_count, r2_prefix)
         VALUES (?, ?, 0, ?)`,
      )
      .bind(context.userId, hostname, generateR2Prefix())
      .run();
    const site = await db
      .prepare("SELECT * FROM sites WHERE id = ?")
      .bind(insert.meta.last_row_id)
      .first<Site>();
    if (!site) throw new Error("Failed to add website. Please try again.");
    return site;
  });

const editSiteSchema = z.object({
  siteId: z.number().int().positive(),
  url_base: z.string().trim().min(1).max(2048),
});

export const editSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(editSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const db = getDb();
    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();
    if (!existing) throw new Error("Website not found or access denied.");

    const hostname = normalizePublicHostname(data.url_base);
    const duplicate = await db
      .prepare(
        `SELECT id FROM sites
         WHERE user_id = ? AND url_base = ? AND id != ?`,
      )
      .bind(context.userId, hostname, data.siteId)
      .first<{ id: number }>();
    if (duplicate) throw new Error("This website already exists in your list.");
    if (hostname === existing.url_base) return existing;

    await db
      .prepare("UPDATE sites SET url_base = ? WHERE id = ? AND user_id = ?")
      .bind(hostname, data.siteId, context.userId)
      .run();
    return { ...existing, url_base: hostname };
  });

const deleteSiteSchema = z.object({ siteId: z.number().int().positive() });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(deleteSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const result = await getDb()
      .prepare("DELETE FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .run();
    if (result.meta.changes === 0) throw new Error("Website not found.");
  });
