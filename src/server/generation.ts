/**
 * Taking and storing a page's screenshot, and the dashboard actions that
 * start one or throw images away. Every screenshot goes through
 * `generateImage()`, behind its guards (REVIEW.md).
 */

import {
  canonicalPage,
  parseWebsiteUrl,
  publicImageUrl,
  validateOutboundUrl,
} from "@/lib/url";
import { recordGenerationEvent } from "@/server/analytics";
import { getDb, type D1Queryable } from "@/server/db";
import { reserveGeneration, userClientKey } from "@/server/generation-usage";
import { cacheGeneratedImage } from "@/server/image-serving";
import {
  acquireGenerationLock,
  buildImageKey,
  deleteSiteImages,
  deleteStoredImages,
  expirePageImage,
  findGlobalImage,
  recordGlobalImageAndRelease,
  releaseGenerationLock,
} from "@/server/image-store";
import { fetchPublicPage } from "@/server/metadata";
import { takeScreenshot } from "@/server/screenshot";
import { forgetPages, forgetUnregistered } from "@/server/use-cache";
import { env, waitUntil } from "cloudflare:workers";

/** A page to screenshot, and the request that asked for it. */
export type Target = {
  url: URL;
  pageUrl: string;
  hostname: string;
  requestHostname: string;
  /** Origin of the request, which serves `/i/*` for this deployment. */
  requestOrigin: string;
};

/**
 * The page a user-supplied URL names, or why this deployment may not
 * screenshot it.
 */
export function resolveTarget(
  value: string,
  requestUrl: string,
): Target | { error: string } {
  const { hostname: requestHostname, origin: requestOrigin } = new URL(
    requestUrl,
  );
  let url: URL;
  try {
    url = parseWebsiteUrl(value);
  } catch {
    return { error: "Please enter a valid website URL." };
  }
  const error = validateOutboundUrl(url, requestHostname);
  if (error) return { error };
  const page = canonicalPage(url);
  return {
    ...page,
    url: new URL(page.pageUrl),
    requestHostname,
    requestOrigin,
  };
}

/**
 * The `/i/<key>` URL for an image, on the origin that served this request
 * rather than the build-time site URL, so Worker Previews read from their own
 * R2 bucket.
 */
export function targetImageUrl(target: Target, key: string): string {
  return publicImageUrl(key, target.requestOrigin);
}

/**
 * Start the page fetch that validates a target's redirects while slower
 * checks run. `cancel()` stops it, and its body, when they fail.
 */
export function startPageFetch(target: Target, deadline?: AbortSignal) {
  const controller = new AbortController();
  const signal = deadline
    ? AbortSignal.any([controller.signal, deadline])
    : controller.signal;
  const page = fetchPublicPage(target.url, target.requestHostname, signal);
  // Callers await this only once the checks pass.
  page.catch(() => {});
  return { page, cancel: () => controller.abort() };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** Overall limit for resolving a page's redirects before a screenshot. */
const PAGE_FETCH_DEADLINE_MS = 8_000;

export type GenerationResult =
  | { status: "ready"; key: string }
  | { status: "rate_limited" | "locked" | "budget_exhausted" | "failed" };

/**
 * Take and store a fresh screenshot of `target`, behind the rate limit,
 * generation lock and daily budget, in that order. Records the outcome. If
 * the image is already fresh once the lock is held, returns it instead.
 *
 * D1 writes go to the primary, which can be far from this colo, so they are
 * batched: lock and re-read, then both budgets, then record and release.
 * The page fetch only validates redirects, so it runs while the budget is
 * reserved; the screenshot waits for both.
 *
 * Every screenshot gets a new R2 key, so an `/i/<key>` URL never changes
 * content and can be cached for good. The image it replaces is deleted;
 * `/i/*` redirects its old URL to the new key.
 */
export async function generateImage(
  db: D1Queryable,
  target: Target,
  client: string,
): Promise<GenerationResult> {
  const { pageUrl, hostname } = target;
  const skip = (
    status: Exclude<GenerationResult["status"], "ready">,
    durationMs?: number,
  ): GenerationResult => {
    recordGenerationEvent({ outcome: status, hostname, pageUrl, durationMs });
    return { status };
  };

  const rateLimit = await env.SITE_RATE_LIMITER.limit({ key: client });
  if (!rateLimit.success) return skip("rate_limited");

  const lock = await acquireGenerationLock(db, pageUrl);
  if (!lock) return skip("locked");

  let released = false;
  try {
    const { current } = lock;
    if (current && current.expiresAt > Date.now()) {
      return { status: "ready", key: current.key };
    }

    const startedAt = Date.now();
    // Background runs get about 30 s after the response, so the page
    // fetch, redirects included, must leave room for the screenshot.
    const { page, cancel } = startPageFetch(
      target,
      AbortSignal.timeout(PAGE_FETCH_DEADLINE_MS),
    );
    let reserved: boolean;
    try {
      reserved = await reserveGeneration(db, "production", client);
    } catch (error) {
      cancel();
      throw error;
    }
    if (!reserved) {
      cancel();
      return skip("budget_exhausted");
    }

    try {
      const { response, finalUrl } = await page;
      await response.body?.cancel();
      const image = await takeScreenshot(finalUrl.toString());
      const key = buildImageKey(await sha256Hex(pageUrl), Date.now());
      const stored = await env.OG_BUCKET.put(key, image, {
        httpMetadata: { contentType: "image/jpeg" },
      });
      await recordGlobalImageAndRelease(
        db,
        target,
        key,
        image.byteLength,
        lock.leaseToken,
      );
      released = true;

      cacheGeneratedImage(targetImageUrl(target, key), image, stored.httpEtag);
      if (current && current.key !== key) {
        waitUntil(
          env.OG_BUCKET.delete(current.key).catch((error) =>
            console.error("[USE] Failed to delete replaced image:", error),
          ),
        );
      }

      recordGenerationEvent({
        outcome: "generated",
        hostname,
        pageUrl,
        durationMs: Date.now() - startedAt,
        bytes: image.byteLength,
      });
      return { status: "ready", key };
    } catch (error) {
      console.error("[USE] Failed to generate or persist image:", error);
      return skip("failed", Date.now() - startedAt);
    }
  } finally {
    if (!released) {
      await releaseGenerationLock(db, pageUrl, lock.leaseToken).catch((error) =>
        console.error("[USE] Failed to release generation lock:", error),
      );
    }
  }
}

// ── Dashboard actions ───────────────────────────────────────────────

const logError = (message: string) => (error: unknown) => {
  console.error(message, error);
};

/**
 * After a user saves a website: forget this colo's cached "not registered"
 * answer for it, and screenshot its home page after the response unless a
 * fresh image exists, so the first social crawler finds one ready. Counted
 * against the user's budget.
 */
export function siteSaved(
  hostname: string,
  requestUrl: string,
  userId: string,
): void {
  const target = resolveTarget(hostname, requestUrl);
  if ("error" in target) return;
  waitUntil(
    forgetUnregistered(target.requestOrigin, target.hostname).catch(
      logError("[SITES] Failed to clear cached /use answer:"),
    ),
  );
  waitUntil(
    (async () => {
      const db = getDb();
      const image = await findGlobalImage(db, target.pageUrl);
      if (image && image.expiresAt > Date.now()) return;
      await generateImage(db, target, userClientKey(userId));
    })().catch(logError("[SITES] Failed to warm site image:")),
  );
}

/**
 * Delete every image of one of the user's websites, so each page is
 * screenshotted again on its next `/use` request. Returns how many were
 * deleted, or `null` when the site isn't the user's.
 *
 * The rows go first, so `/i/*` answers 404 for these keys until a `/use`
 * request stores a new screenshot, which the old key then redirects to. A
 * failed R2 delete only leaves orphaned objects.
 */
export async function resetSiteImages(
  siteId: number,
  userId: string,
  requestUrl: string,
): Promise<number | null> {
  const images = await deleteSiteImages(getDb(), siteId, userId);
  if (!images) return null;
  if (images.length === 0) return 0;

  await deleteStoredImages(
    env.OG_BUCKET,
    images.map(({ key }) => key),
  ).catch(logError("[SITES] Failed to delete regenerated images:"));
  waitUntil(
    forgetPages(
      new URL(requestUrl).origin,
      images.map(({ page_url }) => page_url),
    ).catch(logError("[SITES] Failed to clear cached /use answers:")),
  );
  return images.length;
}

/**
 * Take a new screenshot of one page of the user's websites now. Its image
 * is marked expired first, so `generateImage()` replaces it; the old one
 * keeps serving until then, and stays if the screenshot is skipped (the next
 * `/use` request refreshes it). Counted against the user's budget.
 */
export async function regeneratePage(
  pageUrl: string,
  requestUrl: string,
  userId: string,
): Promise<GenerationResult> {
  const target = resolveTarget(pageUrl, requestUrl);
  if ("error" in target) throw new Error(target.error);

  const db = getDb();
  if (!(await expirePageImage(db, target, userId))) {
    throw new Error("Image not found.");
  }
  await forgetPages(target.requestOrigin, [target.pageUrl]).catch(
    logError("[USE] Failed to clear cached /use answer:"),
  );
  return generateImage(db, target, userClientKey(userId));
}
