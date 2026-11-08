/**
 * Analytics, ad, session-replay, chat-widget, and cookie-consent hosts that
 * screenshots don't load. They never change how a page looks in an OG image
 * (chat bubbles and consent banners only cover it), and their beacons and
 * long polls keep the network busy, which delays `networkidle2`.
 */
const BLOCKED_HOSTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "googleadservices.com",
  "googlesyndication.com",
  "doubleclick.net",
  "connect.facebook.net",
  "analytics.tiktok.com",
  "snap.licdn.com",
  "static.ads-twitter.com",
  "bat.bing.com",
  "hotjar.com",
  "clarity.ms",
  "fullstory.com",
  "mouseflow.com",
  "smartlook.com",
  "logrocket.com",
  "segment.com",
  "segment.io",
  "mixpanel.com",
  "amplitude.com",
  "heapanalytics.com",
  "posthog.com",
  "intercom.io",
  "intercomcdn.com",
  "js.driftt.com",
  "client.crisp.chat",
  "embed.tawk.to",
  "static.zdassets.com",
  // Consent management platforms. Their banners cover the hero, so a page
  // whose consent script never loads is screenshotted without one.
  // `consent-banners.ts` hides the ones a site serves from its own host.
  "cookielaw.org",
  "onetrust.com",
  "cookiepro.com",
  "cookiebot.com",
  "iubenda.com",
  "osano.com",
  "termly.io",
  "usercentrics.eu",
  "privacy-center.org",
  "privacy-mgmt.com",
  "quantcast.com",
  "trustarc.com",
  "cookie-script.com",
  "cookiehub.eu",
  "consentmanager.net",
  "axept.io",
  "ketchcdn.com",
  "cookieyes.com",
  "cookieinformation.com",
  "civiccomputing.com",
];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isSameOrSubdomain = (hostname: string, host: string) =>
  hostname === host || hostname.endsWith(`.${host}`);

/** The blocked hosts for a screenshot of `pageUrl`, minus its own host. */
function blockedHosts(pageUrl: string): string[] {
  const { hostname } = new URL(pageUrl);
  return BLOCKED_HOSTS.filter((host) => !isSameOrSubdomain(hostname, host));
}

/**
 * Browser Run `rejectRequestPattern` entries for a screenshot of `pageUrl`.
 * A blocked host that serves the page itself (say, a screenshot of
 * posthog.com) stays allowed.
 */
export function blockedRequestPatterns(pageUrl: string): string[] {
  return blockedHosts(pageUrl).map(
    (host) =>
      String.raw`^https?://([^/?#]+\.)?${escapeRegExp(host)}(:\d+)?[/?#]`,
  );
}

/**
 * The same rule as `blockedRequestPatterns`, by hostname, for the local
 * Puppeteer fallback.
 */
export function isBlockedRequest(pageUrl: string, requestUrl: string): boolean {
  let hostname: string;
  try {
    ({ hostname } = new URL(requestUrl));
  } catch {
    return false;
  }
  return blockedHosts(pageUrl).some((host) =>
    isSameOrSubdomain(hostname, host),
  );
}
