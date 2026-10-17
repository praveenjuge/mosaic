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
  test("anchors each host to the URL's authority", () => {
    const patterns = blockedRequestPatterns("https://example.com/");
    expect(patterns).toContain(
      String.raw`^https?://([^/?#]+\.)?posthog\.com(:\d+)?[/?#]`,
    );
    expect(patterns).toContain(
      String.raw`^https?://([^/?#]+\.)?connect\.facebook\.net(:\d+)?[/?#]`,
    );
  });

  test("leaves out the page's own host", () => {
    const patterns = blockedRequestPatterns("https://www.posthog.com/");
    expect(patterns.some((pattern) => pattern.includes("posthog"))).toBe(false);
    expect(patterns.length).toBeGreaterThan(0);
  });
});
