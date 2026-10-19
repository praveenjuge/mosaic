/**
 * CSS that hides cookie-consent banners and their backdrops in screenshots.
 * Hosted consent platforms are blocked outright (`blocked-requests.ts`); this
 * covers the ones a site bundles or serves from its own host, such as
 * WordPress plugins. `html` and `body` are never hidden, even when a banner
 * script adds a matching class to them.
 */
const CONSENT_BANNER_SELECTORS = [
  // OneTrust, Cookiebot, Usercentrics, Didomi, Quantcast, TrustArc, Osano.
  "#onetrust-consent-sdk",
  "#onetrust-banner-sdk",
  "#CybotCookiebotDialog",
  "#CybotCookiebotDialogBodyUnderlay",
  "#usercentrics-root",
  "#usercentrics-cmp-ui",
  "#didomi-host",
  ".qc-cmp2-container",
  "#truste-consent-track",
  ".truste_overlay",
  ".osano-cm-window",
  "[id^='sp_message_container']",
  ".fc-consent-root",
  "#cmpbox",
  "#cmpbox2",
  // WordPress and open-source banners.
  ".cc-window",
  ".cc-banner",
  "#cc-main",
  ".cmplz-cookiebanner",
  "#cookie-law-info-bar",
  ".cky-consent-container",
  ".cky-overlay",
  "#cookie-notice",
  "#moove_gdpr_cookie_info_bar",
  "#catapult-cookie-bar",
  ".klaro",
  "#axeptio_overlay",
  "#termly-code-snippet-support",
];

/**
 * Common hand-rolled names. A page can also put such a class on a wrapper
 * (`cookie-consent-accepted` on `#__next`), so these skip any element that
 * holds the page's content. Engines without `:has()` drop this rule only.
 */
const CONSENT_BANNER_NAME_PATTERNS = [
  "[id*='cookie-banner' i]",
  "[class*='cookie-banner' i]",
  "[id*='cookie-consent' i]",
  "[class*='cookie-consent' i]",
  "[id*='cookieconsent' i]",
  "[class*='cookieconsent' i]",
  "[aria-label*='cookie consent' i]",
];

export const CONSENT_BANNER_CSS = [
  `:is(${CONSENT_BANNER_SELECTORS.join(", ")}):not(html, body) { display: none !important; }`,
  `:is(${CONSENT_BANNER_NAME_PATTERNS.join(", ")}):not(html, body, :has(main, header, nav, h1, h2)) { display: none !important; }`,
].join("\n");
