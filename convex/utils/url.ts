const sanitizeUrl = (url: string) => url.trim().replace(/\\+$/, "");

export const cleanUrl = (url: string): string => {
  if (!url) return "";
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    return parsed.hostname;
  } catch {
    try {
      const urlWithProtocol =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;
      const parsed = new URL(urlWithProtocol);
      return parsed.hostname;
    } catch {
      const domainMatch = trimmed.match(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/,
      );
      return domainMatch ? domainMatch[1] : trimmed;
    }
  }
};

export const normalizeUrlBase = (url: string) => cleanUrl(url);

export const extractUrlParts = (fullUrl: string) => {
  const sanitized = sanitizeUrl(fullUrl);
  try {
    const parsed = new URL(sanitized);
    return {
      urlBase: parsed.hostname,
      path: parsed.pathname + parsed.search + parsed.hash,
      sanitizedUrl: sanitized,
    };
  } catch {
    const cleaned = cleanUrl(fullUrl);
    return {
      urlBase: cleaned,
      path: "/",
      sanitizedUrl: sanitized,
    };
  }
};
