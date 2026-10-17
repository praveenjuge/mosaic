/**
 * Fetches public pages with validated redirects, and reads their Open Graph /
 * Twitter Card metadata (title, description, image) for the demo UI.
 */

import { publicEnv } from "./env";
import { validateOutboundUrl } from "./url";

// ── Metadata ────────────────────────────────────────────────────────

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

/**
 * Read Open Graph, Twitter Card, and fallback metadata from a page response.
 * Meta tags are matched on either `property` or `name`, in any attribute
 * order. Only the first `<title>` counts, so inline SVG titles are ignored.
 */
export async function extractMetadata(response: Response, baseUrl: URL) {
  const meta = new Map<string, string>();
  let titleCount = 0;
  let titleTag = "";

  await new HTMLRewriter()
    .on("meta[content]", {
      element(element) {
        const key = (
          element.getAttribute("property") ?? element.getAttribute("name")
        )?.toLowerCase();
        const content = normalizeText(element.getAttribute("content") ?? "");
        if (key && content && !meta.has(key)) meta.set(key, content);
      },
    })
    .on("title", {
      element() {
        titleCount++;
      },
      text({ text }) {
        if (titleCount === 1) titleTag += text;
      },
    })
    .transform(response)
    .arrayBuffer();

  const first = (...keys: string[]) =>
    keys.map((key) => meta.get(key)).find(Boolean) ?? "";

  const title =
    first("og:title", "twitter:title", "title") || normalizeText(titleTag);
  const description = first(
    "og:description",
    "description",
    "twitter:description",
  );
  let image = first("og:image", "twitter:image", "twitter:image:src");
  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      // Keep original if it can't be normalized.
    }
  }

  return { title, description, image };
}

// ── Fetching ────────────────────────────────────────────────────────

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

/**
 * Fetch a public page, validating every redirect hop against
 * `validateOutboundUrl`. Resolves once headers arrive, with the URL the
 * redirects ended at. The caller reads or cancels the body.
 */
export async function fetchPublicPage(
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
