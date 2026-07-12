/**
 * HTML metadata extraction utilities for OG image demo mode.
 *
 * Fetches a page's HTML and extracts Open Graph / Twitter Card
 * metadata (title, description, image) for display in the demo UI.
 */

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

export async function fetchPageHtml(url: URL): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MosaicBot/1.0; +https://mosaic.praveenjuge.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    throw new Error(
      "Failed to fetch metadata. Please check the URL and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(getUserMessageForStatus(response.status));
  }

  return response.text();
}
