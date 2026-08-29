import { describe, expect, test } from "bun:test";
import {
  buildUseEndpointUrl,
  extractUrlParts,
  isBlockedOutboundHostname,
  isSelfReferentialUseUrl,
  validateOutboundUrl,
} from "./url";

describe("outbound URL security", () => {
  test.each([
    "localhost",
    "api.localhost",
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:ac10:1",
    "::ffff:a9fe:101",
  ])("blocks non-public hostname %s", (hostname) => {
    expect(isBlockedOutboundHostname(hostname)).toBe(true);
  });

  test.each(["example.com", "fcdomain.com", "1.1.1.1", "2001:4860:4860::8888"])(
    "allows public hostname %s",
    (hostname) => {
      expect(isBlockedOutboundHostname(hostname)).toBe(false);
    },
  );

  test("blocks the configured /use endpoint but allows ordinary app pages", () => {
    expect(
      isSelfReferentialUseUrl(
        new URL("https://mosaic.example/use?url=https://example.com"),
        "mosaic.example",
      ),
    ).toBe(true);
    expect(
      isSelfReferentialUseUrl(
        new URL("https://mosaic.example/docs"),
        "mosaic.example",
      ),
    ).toBe(false);
  });

  test("blocks recursive workers.dev targets", () => {
    expect(
      validateOutboundUrl(
        new URL("https://mosaic.account.workers.dev/use"),
        "mosaic.example",
      ),
    ).toContain("/use endpoint");
  });

  test("blocks URLs with embedded credentials", () => {
    expect(
      validateOutboundUrl(new URL("https://user:secret@example.com/page")),
    ).toContain("credentials");
  });
});

describe("canonical OG page identity", () => {
  test("preserves the query but removes fragments and trailing slashes", () => {
    expect(
      extractUrlParts("https://example.com/page/?view=full#section"),
    ).toEqual({
      urlBase: "example.com",
      path: "/page/?view=full",
      sanitizedUrl: "https://example.com/page/?view=full",
    });
  });

  test("builds a directly usable unsigned endpoint URL", () => {
    const endpoint = new URL(
      buildUseEndpointUrl(
        "https://mosaic.example",
        "https://example.com/page?view=full",
      ),
    );

    expect(endpoint.pathname).toBe("/use");
    expect(endpoint.searchParams.get("url")).toBe(
      "https://example.com/page?view=full",
    );
    expect(endpoint.searchParams.has("sig")).toBe(false);
  });
});
