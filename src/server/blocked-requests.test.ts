import { describe, expect, test } from "bun:test";
import { blockedRequestPatterns, isBlockedRequest } from "./blocked-requests";

describe("isBlockedRequest", () => {
  test("blocks tracker hosts and their subdomains", () => {
    const page = "https://example.com/";
    expect(
      isBlockedRequest(page, "https://www.googletagmanager.com/gtm.js?id=G-1"),
    ).toBe(true);
    expect(isBlockedRequest(page, "https://us.i.posthog.com/e/")).toBe(true);
    expect(isBlockedRequest(page, "https://static.hotjar.com/c/h.js")).toBe(
      true,
    );
  });

  test("blocks hosted consent platforms, whose banners cover the hero", () => {
    const page = "https://example.com/";
    for (const url of [
      "https://cdn.cookielaw.org/scripttemplates/x.js",
      "https://consent.cookiebot.com/uc.js?cbid=1",
      "https://app.usercentrics.eu/browser-ui/x.js",
    ]) {
      expect(isBlockedRequest(page, url)).toBe(true);
    }
  });

  test("leaves the page's own resources and look-alike hosts alone", () => {
    const page = "https://example.com/";
    expect(isBlockedRequest(page, "https://example.com/app.js")).toBe(false);
    expect(isBlockedRequest(page, "https://cdn.example.com/hero.png")).toBe(
      false,
    );
    expect(isBlockedRequest(page, "https://notposthog.com/")).toBe(false);
    expect(isBlockedRequest(page, "https://posthog.com.example.net/x")).toBe(
      false,
    );
    expect(
      isBlockedRequest(page, "https://example.com/?r=www.google-analytics.com"),
    ).toBe(false);
    expect(isBlockedRequest(page, "data:image/png;base64,AAAA")).toBe(false);
  });

  test("allows a blocked host when it serves the page itself", () => {
    const page = "https://posthog.com/";
    expect(isBlockedRequest(page, "https://posthog.com/")).toBe(false);
    expect(isBlockedRequest(page, "https://us.i.posthog.com/e/")).toBe(false);
    expect(isBlockedRequest(page, "https://www.google-analytics.com/g")).toBe(
      true,
    );
  });
});

describe("blockedRequestPatterns", () => {
  const page = "https://example.com/";
  const urls = [
    "https://us.i.posthog.com/e",
    "http://posthog.com:8080/",
    "https://posthog.com?x",
    "https://connect.facebook.net/en_US/fbevents.js",
    "https://cdn.cookielaw.org/scripttemplates/x.js",
    "https://notposthog.com/",
    "https://posthog.com.example.net/x",
    "https://example.com/?r=posthog.com/",
    "https://cdn.example.com/hero.png",
  ];

  test("block exactly the requests isBlockedRequest blocks", () => {
    const patterns = blockedRequestPatterns(page).map(
      (pattern) => new RegExp(pattern),
    );
    for (const url of urls) {
      expect(
        patterns.some((pattern) => pattern.test(url)),
        url,
      ).toBe(isBlockedRequest(page, url));
    }
  });

  test("leave out the page's own host", () => {
    const patterns = blockedRequestPatterns("https://www.posthog.com/").map(
      (pattern) => new RegExp(pattern),
    );
    expect(patterns.length).toBeGreaterThan(0);
    expect(
      patterns.some((pattern) => pattern.test("https://us.i.posthog.com/e")),
    ).toBe(false);
  });
});
