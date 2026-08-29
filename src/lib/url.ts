import { publicEnv } from "./env";

// OG images are served by the Worker itself at `/i/<r2key>` (no separate
// R2 custom domain). R2 keys contain slashes, so this is a splat route.
export const DEFAULT_PUBLIC_IMAGE_BASE_URL = new URL(
  "i/",
  publicEnv.siteUrl,
).toString();

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

// ── Outbound URL security ──────────────────────────────────────────

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0x00ffffff],
  [0x0a000000, 0x0affffff],
  [0x64400000, 0x647fffff],
  [0x7f000000, 0x7fffffff],
  [0xa9fe0000, 0xa9feffff],
  [0xac100000, 0xac1fffff],
  [0xc0000000, 0xc00000ff],
  [0xc0a80000, 0xc0a8ffff],
  [0xc6120000, 0xc613ffff],
  [0xe0000000, 0xffffffff],
];

function ipv4ToNumber(hostname: string): number | null {
  const octets = hostname.split(".");
  if (octets.length !== 4) return null;
  const values = octets.map(Number);
  if (
    values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    return null;
  }
  return values.reduce((total, value) => total * 256 + value, 0) >>> 0;
}

/** Reject local, private, link-local, multicast, and reserved literal targets. */
export function isBlockedOutboundHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".home.arpa")
  ) {
    return true;
  }

  const ipv4 = ipv4ToNumber(normalized);
  if (ipv4 !== null) {
    return PRIVATE_IPV4_RANGES.some(
      ([first, last]) => ipv4 >= first && ipv4 <= last,
    );
  }

  if (!normalized.includes(":")) return false;

  const mappedIpv4 = normalized.match(
    /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/,
  );
  if (mappedIpv4) {
    const address =
      (Number.parseInt(mappedIpv4[1], 16) * 0x10000 +
        Number.parseInt(mappedIpv4[2], 16)) >>>
      0;
    if (
      PRIVATE_IPV4_RANGES.some(
        ([first, last]) => address >= first && address <= last,
      )
    ) {
      return true;
    }
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:0:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

export function isSelfReferentialUseUrl(
  candidate: URL,
  requestHostname: string,
): boolean {
  if (candidate.pathname.replace(/\/+$/, "") !== "/use") return false;

  const hostname = candidate.hostname.toLowerCase();
  const configuredHostname = new URL(publicEnv.siteUrl).hostname.toLowerCase();
  return (
    hostname === requestHostname.toLowerCase() ||
    hostname === configuredHostname ||
    hostname.endsWith(".workers.dev")
  );
}

export function validateOutboundUrl(
  candidate: URL,
  requestHostname?: string,
): string | null {
  if (candidate.protocol !== "http:" && candidate.protocol !== "https:") {
    return "Only HTTP and HTTPS URLs are supported.";
  }
  if (candidate.username || candidate.password) {
    return "URLs with embedded credentials are not allowed.";
  }
  if (isBlockedOutboundHostname(candidate.hostname)) {
    return "Local and private network URLs are not allowed.";
  }
  if (requestHostname && isSelfReferentialUseUrl(candidate, requestHostname)) {
    return "URL may not target this service's /use endpoint.";
  }
  return null;
}

// ── Domain extraction ───────────────────────────────────────────────

export function extractHostname(value: string) {
  return parseWebsiteUrl(value).hostname;
}

export function extractUrlParts(fullUrl: string) {
  const parsed = parseWebsiteUrl(fullUrl);
  parsed.hash = "";
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

export function buildUsePreviewUrl(baseUrl: string, targetUrl: string) {
  const endpoint = new URL(buildUseEndpointUrl(baseUrl, targetUrl));
  endpoint.searchParams.set("preview", "1");
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
  return buildUseEndpointUrl(publicEnv.siteUrl, targetUrl);
}
