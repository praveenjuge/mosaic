import { describe, expect, test } from "bun:test";
import { buildMetaTags, pageUrlFor } from "./meta-tags";

describe("pageUrlFor", () => {
  test("joins a typed path to the hostname", () => {
    expect(pageUrlFor("example.com", "")).toBe("https://example.com");
    expect(pageUrlFor("example.com", "  ")).toBe("https://example.com");
    expect(pageUrlFor("example.com", "blog/post")).toBe(
      "https://example.com/blog/post",
    );
    expect(pageUrlFor("example.com", "///pricing?plan=pro")).toBe(
      "https://example.com/pricing?plan=pro",
    );
  });

  test("keeps an http: page's protocol, which has its own image", () => {
    expect(pageUrlFor("example.com", "blog", "http:")).toBe(
      "http://example.com/blog",
    );
    expect(pageUrlFor("example.com", "http://example.com/a")).toBe(
      "http://example.com/a",
    );
  });

  test("accepts a full URL on the same hostname", () => {
    expect(pageUrlFor("example.com", "https://example.com/docs/")).toBe(
      "https://example.com/docs/",
    );
  });
});

describe("buildMetaTags", () => {
  test("points og:image and twitter:image at the encoded /use URL", () => {
    const tags = buildMetaTags("https://example.com/blog/post");
    const imageUrl =
      "https://mosaic.example/use?url=https%3A%2F%2Fexample.com%2Fblog%2Fpost";
    expect(tags).toContain(
      `<meta property="og:image" content="${imageUrl}" />`,
    );
    expect(tags).toContain(
      `<meta name="twitter:image" content="${imageUrl}" />`,
    );
    expect(tags).toContain(
      '<meta name="twitter:card" content="summary_large_image" />',
    );
  });
});
