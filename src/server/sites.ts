import { getDb } from "@/lib/db";
import type { Site } from "@/lib/types";
import { extractHostname, validateOutboundUrl } from "@/lib/url";
import { createServerFn } from "@tanstack/react-start";
import { env, waitUntil } from "cloudflare:workers";
import { z } from "zod";
import { authMiddleware } from "./middleware";

// ── Helpers ─────────────────────────────────────────────────────────

function generateR2Prefix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function normalizePublicHostname(value: string): string {
  const hostname = extractHostname(value);
  const error = validateOutboundUrl(new URL(`https://${hostname}`));
  if (error) throw new Error(error);
  return hostname;
}

async function readSmallTextResponse(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 1024) {
      await reader.cancel();
      throw new Error("Verification file must be smaller than 1 KB.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

// ── List Sites ──────────────────────────────────────────────────────

export const listSitesForUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Site[]> => {
    // Read-only query — use a read session to hit the nearest replica
    const session = getDb().withSession();
    const result = await session
      .prepare("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC")
      .bind(context.userId)
      .all<Site>();

    return result.results;
  });

// ── Add Site ────────────────────────────────────────────────────────

const addSiteSchema = z.object({
  url_base: z.string().trim().min(1).max(2048),
});

export const addSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(addSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const normalizedUrl = normalizePublicHostname(data.url_base);
    const db = getDb();

    const existing = await db
      .prepare("SELECT id FROM sites WHERE user_id = ? AND url_base = ?")
      .bind(context.userId, normalizedUrl)
      .first<{ id: number }>();

    if (existing) {
      throw new Error("This website already exists in your list.");
    }

    const claimedByOther = await db
      .prepare(
        `SELECT id FROM sites
         WHERE url_base = ? AND user_id != ? AND verified_at IS NOT NULL`,
      )
      .bind(normalizedUrl, context.userId)
      .first<{ id: number }>();

    if (claimedByOther) {
      throw new Error("This website is already verified by another account.");
    }

    const r2Prefix = generateR2Prefix();
    const verificationToken = generateSecret();

    const insertResult = await db
      .prepare(
        `INSERT INTO sites
           (user_id, url_base, image_count, r2_prefix, verification_token)
         VALUES (?, ?, 0, ?, ?)`,
      )
      .bind(context.userId, normalizedUrl, r2Prefix, verificationToken)
      .run();

    const newSite = await db
      .prepare("SELECT * FROM sites WHERE id = ?")
      .bind(insertResult.meta.last_row_id)
      .first<Site>();

    if (!newSite) {
      throw new Error("Failed to create website. Please try again.");
    }

    return newSite;
  });

// ── Edit Site ───────────────────────────────────────────────────────

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

    if (!existing) {
      throw new Error("Website not found or access denied.");
    }

    const normalizedUrl = normalizePublicHostname(data.url_base);

    const duplicate = await db
      .prepare(
        "SELECT id FROM sites WHERE user_id = ? AND url_base = ? AND id != ?",
      )
      .bind(context.userId, normalizedUrl, data.siteId)
      .first<{ id: number }>();

    if (duplicate) {
      throw new Error("This website already exists in your list.");
    }

    if (normalizedUrl === existing.url_base) return existing;

    const claimedByOther = await db
      .prepare(
        `SELECT id FROM sites
         WHERE url_base = ? AND user_id != ? AND verified_at IS NOT NULL`,
      )
      .bind(normalizedUrl, context.userId)
      .first<{ id: number }>();

    if (claimedByOther) {
      throw new Error("This website is already verified by another account.");
    }

    const verificationToken = generateSecret();

    await db
      .prepare(
        `UPDATE sites
         SET url_base = ?, verification_token = ?, verified_at = NULL,
             generation_secret = NULL
         WHERE id = ?`,
      )
      .bind(normalizedUrl, verificationToken, data.siteId)
      .run();

    return {
      ...existing,
      url_base: normalizedUrl,
      verification_token: verificationToken,
      verified_at: null,
      generation_secret: null,
    };
  });

// ── Verify Site Ownership ──────────────────────────────────────────

const verifySiteSchema = z.object({ siteId: z.number().int().positive() });

export const verifySite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(verifySiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const db = getDb();
    const site = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!site) throw new Error("Website not found or access denied.");
    if (site.verified_at) return site;
    if (!site.verification_token) {
      throw new Error("Verification token is missing. Please contact support.");
    }

    const verificationUrl = new URL(
      "/.well-known/mosaic-verification.txt",
      `https://${site.url_base}`,
    );
    let response: Response;
    try {
      response = await fetch(verificationUrl, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(8_000),
        headers: { Accept: "text/plain" },
      });
    } catch {
      throw new Error(
        "Could not reach the verification file over HTTPS. Please check the file and try again.",
      );
    }

    if (!response.ok || response.status >= 300) {
      throw new Error(
        "Verification file was not found. It must be served directly over HTTPS without redirects.",
      );
    }

    const body = (await readSmallTextResponse(response)).trim();
    if (body !== site.verification_token) {
      throw new Error("Verification file does not contain the expected token.");
    }

    const generationSecret = generateSecret();
    try {
      const verified = await db
        .prepare(
          `UPDATE sites
           SET verified_at = datetime('now'), generation_secret = ?
           WHERE id = ? AND user_id = ? AND verified_at IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM sites
               WHERE url_base = ? AND verified_at IS NOT NULL AND id != ?
             )
           RETURNING *`,
        )
        .bind(
          generationSecret,
          data.siteId,
          context.userId,
          site.url_base,
          data.siteId,
        )
        .first<Site>();

      if (!verified) {
        throw new Error("This website is already verified by another account.");
      }
      return verified;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "This website is already verified by another account."
      ) {
        throw error;
      }
      throw new Error("This website is already verified by another account.", {
        cause: error,
      });
    }
  });

// ── Delete Site ─────────────────────────────────────────────────────

const deleteSiteSchema = z.object({
  siteId: z.number().int().positive(),
});

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(deleteSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!existing) {
      throw new Error("Website not found.");
    }

    // Delete site row first for immediate user feedback — cascades to images via FK
    await db.prepare("DELETE FROM sites WHERE id = ?").bind(data.siteId).run();

    // Clean up R2 objects in the background — don't block the response
    const r2Prefix = existing.r2_prefix;
    waitUntil(
      (async () => {
        let cursor: string | undefined;
        do {
          const listed = await env.OG_BUCKET.list({
            prefix: `${r2Prefix}/`,
            cursor,
          });
          if (listed.objects.length > 0) {
            await Promise.all(
              listed.objects.map((obj) => env.OG_BUCKET.delete(obj.key)),
            );
          }
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
      })().catch((err) =>
        console.error("[DELETE] R2 cleanup failed for prefix:", r2Prefix, err),
      ),
    );
  });

// ── Refresh Site Images ─────────────────────────────────────────────

const refreshSiteSchema = z.object({
  siteId: z.number().int().positive(),
});

export const refreshSiteImages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(refreshSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!existing) {
      throw new Error("Website not found or access denied.");
    }

    // Images and redirects are served without Cache API persistence, so R2 is
    // the sole source of truth and deletion is immediately authoritative.
    const oldPrefix = existing.r2_prefix;
    let cursor: string | undefined;
    do {
      const listed = await env.OG_BUCKET.list({
        prefix: `${oldPrefix}/`,
        cursor,
      });
      if (listed.objects.length > 0) {
        // R2 delete accepts up to 1000 keys at once
        const keys = listed.objects.map((obj) => obj.key);
        await env.OG_BUCKET.delete(keys);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    // Generate a new r2_prefix for fresh namespace.
    const newR2Prefix = generateR2Prefix();

    // Stored-image count resets, but the current-month user_usage deliberately
    // remains untouched so refresh cannot renew the generation allowance.
    await db.batch([
      db.prepare("DELETE FROM images WHERE site_id = ?").bind(data.siteId),
      db
        .prepare(
          "UPDATE sites SET r2_prefix = ?, image_count = 0, refreshed_at = datetime('now') WHERE id = ?",
        )
        .bind(newR2Prefix, data.siteId),
    ]);
  });
