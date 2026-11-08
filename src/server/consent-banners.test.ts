import { describe, expect, test } from "bun:test";
import { isBlockedRequest } from "./blocked-requests";
import { CONSENT_BANNER_CSS } from "./consent-banners";

describe("consent banners", () => {
  test("hosted consent platforms are blocked", () => {
    const page = "https://example.com/";
    expect(
      isBlockedRequest(page, "https://cdn.cookielaw.org/scripttemplates/x.js"),
    ).toBe(true);
    expect(
      isBlockedRequest(page, "https://consent.cookiebot.com/uc.js?cbid=1"),
    ).toBe(true);
    expect(
      isBlockedRequest(page, "https://app.usercentrics.eu/browser-ui/x.js"),
    ).toBe(true);
  });

  test("the CSS hides banners but never the page itself", () => {
    expect(CONSENT_BANNER_CSS).toContain("#onetrust-consent-sdk");
    expect(CONSENT_BANNER_CSS).toContain("#CybotCookiebotDialog");
    expect(CONSENT_BANNER_CSS).toContain(":not(html, body)");
    expect(CONSENT_BANNER_CSS).toEndWith("{ display: none !important; }");
  });

  test("name patterns skip wrappers that hold the page's content", () => {
    const [, patterns] = CONSENT_BANNER_CSS.split("\n");
    expect(patterns).toContain("[class*='cookie-consent' i]");
    expect(patterns).toContain(":has(main, header, nav, h1, h2)");
  });
});
