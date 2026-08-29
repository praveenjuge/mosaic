/**
 * HTML metadata extraction utilities for OG image demo mode.
 *
 * Fetches a page's HTML and extracts Open Graph / Twitter Card
 * metadata (title, description, image) for display in the demo UI.
 */

import { publicEnv } from "./env";
import { validateOutboundUrl } from "./url";

// ── Helpers ─────────────────────────────────────────────────────────

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

function extractMeta(
  html: string,
  attr: "property" | "name",
  names: string[],
): string | null {
  for (const name of names) {
    const regex = new RegExp(
      `<meta[^>]*${attr}=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? normalizeText(match[1]) : null;
}

// ── Public API ──────────────────────────────────────────────────────

export function extractMetadata(html: string, baseUrl: URL) {
  const title =
    extractMeta(html, "property", ["og:title"]) ||
    extractMeta(html, "name", ["twitter:title", "title"]) ||
    extractTitleTag(html) ||
    "";

  const description =
    extractMeta(html, "property", ["og:description"]) ||
    extractMeta(html, "name", ["description", "twitter:description"]) ||
    "";

  let image =
    extractMeta(html, "property", ["og:image"]) ||
    extractMeta(html, "name", ["twitter:image", "twitter:image:src"]) ||
    "";

  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      // Keep original if it can't be normalized.
    }
  }

  return { title, description, image };
}

function getUserMessageForStatus(status: number): string {
  if (status === 403) {
    return "This website blocks automated requests. Please try a different URL.";
  }
  if (status === 404) {
    return "The requested page was not found. Please check the URL and try again.";
  }
  if (status === 502) {
    return "The website is currently experiencing issues. Please try again later.";
  }
  return "Failed to fetch metadata";
}

const MAX_REDIRECT_HOPS = 5;

async function fetchPublicPage(
  url: URL,
  requestHostname: string,
): Promise<{ response: Response; finalUrl: URL }> {
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const validationError = validateOutboundUrl(currentUrl, requestHostname);
    if (validationError) throw new Error(validationError);

    let response: Response;
    try {
      response = await fetch(currentUrl.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(5_000),
        headers: {
          "User-Agent": `Mozilla/5.0 (compatible; MosaicBot/1.0; +${publicEnv.siteUrl})`,
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      throw new Error(
        "Failed to fetch metadata. Please check the URL and try again.",
      );
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      await response.body?.cancel();
      if (!location || hop === MAX_REDIRECT_HOPS) {
        throw new Error("The website redirected too many times.");
      }

      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        throw new Error("The website returned an invalid redirect.");
      }
      continue;
    }

    if (!response.ok) {
      throw new Error(getUserMessageForStatus(response.status));
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error("The website redirected too many times.");
}

export async function fetchPageHtml(
  url: URL,
  requestHostname: string,
): Promise<string> {
  const { response } = await fetchPublicPage(url, requestHostname);
  return response.text();
}

/** Resolve and validate every server redirect before Browser Run navigation. */
export async function resolvePublicPageUrl(
  url: URL,
  requestHostname: string,
): Promise<URL> {
  const { response, finalUrl } = await fetchPublicPage(url, requestHostname);
  await response.body?.cancel();
  return finalUrl;
}
