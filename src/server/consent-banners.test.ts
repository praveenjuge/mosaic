import { describe, expect, test } from "bun:test";
import { CONSENT_BANNER_CSS } from "./consent-banners";

describe("consent banners", () => {
  test("the CSS hides banners but never the page itself", () => {
    expect(CONSENT_BANNER_CSS).toContain("#onetrust-consent-sdk");
    expect(CONSENT_BANNER_CSS).toContain("#CybotCookiebotDialog");
    expect(CONSENT_BANNER_CSS).toContain(":not(html, body)");
    expect(CONSENT_BANNER_CSS).toEndWith("{ display: none !important; }");
  });

  test("name patterns skip wrappers that hold the page's content", () => {
    expect(CONSENT_BANNER_CSS).toMatch(
      /\[class\*='cookie-consent' i\][^{]*:has\(main, header, nav, h1, h2\)/,
    );
  });
});
