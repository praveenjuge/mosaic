const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const TRAILING_SLASH_PATTERN = /\/+$/;

function trimUrl(value: string) {
  return value.trim();
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

export function normalizeUrlBase(value: string) {
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

export function cleanDisplayUrl(value: string) {
  return stripUrlProtocol(stripTrailingSlashes(value));
}
