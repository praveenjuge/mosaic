import { describe, expect, test } from "bun:test";
import { blockedRequestPatterns } from "./blocked-requests";

function isBlocked(pageUrl: string, requestUrl: string) {
  return blockedRequestPatterns(pageUrl).some((pattern) =>
    new RegExp(pattern).test(requestUrl),
  );
}

describe("blockedRequestPatterns", () => {
  test("blocks tracker hosts and their subdomains", () => {
    const page = "https://example.com/";
    expect(
      isBlocked(page, "https://www.googletagmanager.com/gtm.js?id=GTM-1"),
    ).toBe(true);
    expect(isBlocked(page, "https://us.i.posthog.com/e/")).toBe(true);
    expect(isBlocked(page, "https://static.hotjar.com/c/hotjar.js")).toBe(true);
  });

  test("leaves the page's own resources and look-alike hosts alone", () => {
    const page = "https://example.com/";
    expect(isBlocked(page, "https://example.com/app.js")).toBe(false);
    expect(isBlocked(page, "https://cdn.example.com/hero.png")).toBe(false);
    expect(isBlocked(page, "https://notposthog.com/")).toBe(false);
    expect(isBlocked(page, "https://posthog.com.example.net/x")).toBe(false);
    expect(
      isBlocked(page, "https://example.com/?ref=www.google-analytics.com/"),
    ).toBe(false);
  });

  test("allows a blocked host when it serves the page itself", () => {
    expect(isBlocked("https://posthog.com/", "https://posthog.com/")).toBe(
      false,
    );
    expect(
      isBlocked("https://posthog.com/", "https://us.i.posthog.com/e/"),
    ).toBe(false);
    expect(
      isBlocked("https://posthog.com/", "https://www.google-analytics.com/g"),
    ).toBe(true);
  });
});
