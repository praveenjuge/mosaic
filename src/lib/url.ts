import { ensureTrailingSlash, publicEnv } from "./env";

// OG images are served by the Worker itself at `/i/<r2key>` (no separate
// R2 custom domain). R2 keys contain slashes, so this is a splat route.
export const DEFAULT_PUBLIC_IMAGE_BASE_URL = new URL(
  "i/",
  publicEnv.siteUrl,
).toString();

// ── Parsing ─────────────────────────────────────────────────────────

export function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

/** Parse user input as an HTTP(S) URL, adding `https://` to bare hostnames. */
export function parseWebsiteUrl(value: string): URL {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Please enter a valid website URL.");
  }

  const parsed = new URL(
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  );
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }
  return parsed;
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
  if (stripTrailingSlashes(candidate.pathname) !== "/use") return false;

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

// ── Canonical page identity ─────────────────────────────────────────

/**
 * A page's identity in the shared cache: the URL without its fragment or
 * trailing slashes. `global_images` rows are keyed by `pageUrl`, so changing
 * this orphans every cached image.
 */
export function canonicalPage(url: URL): { pageUrl: string; hostname: string } {
  const copy = new URL(url);
  copy.hash = "";
  return {
    pageUrl: stripTrailingSlashes(copy.toString()),
    hostname: copy.hostname,
  };
}

export function cleanDisplayUrl(value: string) {
  return stripTrailingSlashes(value).replace(/^https?:\/\//, "");
}

// ── URL builders ────────────────────────────────────────────────────

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

/** The `/use` URL that screenshots one of Mosaic's own pages. */
export function getOgImageUrl(slug: string) {
  const targetUrl = new URL(slug.replace(/^\//, ""), publicEnv.siteUrl);
  return buildUseEndpointUrl(publicEnv.siteUrl, targetUrl.toString());
}
