import { publicEnv } from "./env";

// ── Constants ───────────────────────────────────────────────────────

export const DEFAULT_SITE_URL = "https://mosaicimg.com/";
export const DEFAULT_PUBLIC_IMAGE_BASE_URL = "https://og.mosaicimg.com/";

// ── Low-level URL manipulation ──────────────────────────────────────

const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const TRAILING_SLASH_PATTERN = /\/+$/;

function trimUrl(value: string) {
  return value.trim();
}

export function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

export function ensureWebsiteProtocol(value: string) {
  const trimmed = trimUrl(value);

  if (!trimmed) {
    throw new Error("Please enter a valid website URL.");
  }

  return HTTP_PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseWebsiteUrl(value: string) {
  const parsed = new URL(ensureWebsiteProtocol(value));

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  return parsed;
}

export function stripTrailingSlashes(value: string) {
  return value.replace(TRAILING_SLASH_PATTERN, "");
}

export function stripUrlProtocol(value: string) {
  return value.replace(/^https?:\/\//, "");
}

// ── Domain extraction ───────────────────────────────────────────────

export function extractHostname(value: string) {
  return parseWebsiteUrl(value).hostname;
}

export function extractUrlParts(fullUrl: string) {
  const parsed = parseWebsiteUrl(fullUrl);
  const sanitizedUrl = stripTrailingSlashes(parsed.toString());

  return {
    urlBase: parsed.hostname,
    path: `${parsed.pathname}${parsed.search}${parsed.hash}` || "/",
    sanitizedUrl,
  };
}

// ── Display helpers ─────────────────────────────────────────────────

export function cleanDisplayUrl(value: string) {
  return stripUrlProtocol(stripTrailingSlashes(value));
}

// ── URL builders (OG / R2 / use endpoint) ───────────────────────────

export function buildUseEndpointUrl(baseUrl: string, targetUrl: string) {
  const endpoint = new URL("use", ensureTrailingSlash(baseUrl));
  endpoint.searchParams.set("url", targetUrl);
  return endpoint.toString();
}

export function buildPublicImageUrl(
  key: string,
  baseUrl = DEFAULT_PUBLIC_IMAGE_BASE_URL,
) {
  return new URL(key, ensureTrailingSlash(baseUrl)).toString();
}

export function buildSiteOgImageUrl(siteUrl: string, targetUrl: string) {
  return buildUseEndpointUrl(siteUrl, targetUrl);
}

export function getOgImageUrl(slug: string) {
  const normalizedSlug = slug.replace(/^\//, "");
  const targetUrl = new URL(normalizedSlug, publicEnv.siteUrl).toString();

  return buildSiteOgImageUrl(publicEnv.siteUrl, targetUrl);
}
