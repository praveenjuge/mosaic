import { publicEnv } from "@/lib/env";
import { buildUseEndpointUrl } from "@/lib/url";

export type PageProtocol = "http:" | "https:";

/**
 * The page URL for what a user typed after a website's hostname: a path, or
 * a full URL on that hostname. `http:` and `https:` pages have separate
 * images, so the protocol is kept: the one of a typed full URL, else
 * `protocol`.
 */
export function pageUrlFor(
  hostname: string,
  input: string,
  protocol: PageProtocol = "https:",
): string {
  let path = input.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (url.hostname === hostname) {
        path = `${url.pathname}${url.search}`;
        protocol = url.protocol === "http:" ? "http:" : "https:";
      }
    } catch {
      // Not a URL after all; treat it as a path.
    }
  }
  path = path.replace(/^\/+/, "");
  const origin = `${protocol}//${hostname}`;
  return path ? `${origin}/${path}` : origin;
}

/** The `<head>` tags that point a page's link previews at its Mosaic image. */
export function buildMetaTags(pageUrl: string): string {
  const imageUrl = buildUseEndpointUrl(publicEnv.siteUrl, pageUrl);
  return [
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta property="og:image:width" content="1560" />`,
    `<meta property="og:image:height" content="819" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
  ].join("\n");
}
