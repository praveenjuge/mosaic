import { describe, expect, test } from "bun:test";
import {
  type MarkdownContentRef,
  markdownNegotiationResponse,
  matchMarkdownPath,
  prefersMarkdown,
  toMarkdownDocument,
} from "./markdown-negotiation";

const browserAccept =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

describe("prefersMarkdown", () => {
  test("accepts a plain Markdown request", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
  });

  test("rejects a normal browser Accept header", () => {
    expect(prefersMarkdown(browserAccept)).toBe(false);
  });

  test("rejects a wildcard-only Accept header", () => {
    expect(prefersMarkdown("*/*")).toBe(false);
  });

  test("rejects a missing Accept header", () => {
    expect(prefersMarkdown(null)).toBe(false);
  });

  test("rejects Markdown with a zero quality value", () => {
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });

  test("honors HTML preferred with a higher quality value", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, text/html;q=1")).toBe(false);
  });

  test("accepts Markdown preferred over HTML", () => {
    expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  });

  test("matches media types case-insensitively", () => {
    expect(prefersMarkdown("Text/Markdown")).toBe(true);
  });
});

describe("matchMarkdownPath", () => {
  test("maps the homepage to the site mirror", () => {
    expect(matchMarkdownPath("/")).toEqual({ kind: "home" });
  });

  test("maps help articles", () => {
    expect(matchMarkdownPath("/help/hello-world")).toEqual({
      kind: "help",
      slug: "hello-world",
    });
  });

  test("maps framework guides", () => {
    expect(matchMarkdownPath("/help/guides/react")).toEqual({
      kind: "guide",
      slug: "react",
    });
  });

  test("maps the legal overview", () => {
    expect(matchMarkdownPath("/legal")).toEqual({ kind: "legal" });
  });

  test("tolerates a trailing slash", () => {
    expect(matchMarkdownPath("/help/hello-world/")).toEqual({
      kind: "help",
      slug: "hello-world",
    });
  });

  test("does not match other routes", () => {
    expect(matchMarkdownPath("/dashboard")).toBeNull();
    expect(matchMarkdownPath("/help")).toBeNull();
    expect(matchMarkdownPath("/help/guides")).toBeNull();
    expect(matchMarkdownPath("/sign-in")).toBeNull();
  });
});

describe("markdownNegotiationResponse", () => {
  const resolver = (ref: MarkdownContentRef) =>
    ref.kind === "home" ? "# Mosaic\n" : null;

  function request(accept: string, method = "GET", path = "/") {
    return new Request(`https://mosaic.example${path}`, {
      headers: { Accept: accept },
      method,
    });
  }

  test("serves Markdown for the homepage instead of the SSR 500", async () => {
    const response = markdownNegotiationResponse(
      request("text/markdown"),
      resolver,
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);
    expect(response?.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");
    expect(await response?.text()).toBe("# Mosaic\n");
  });

  test("keeps serving HTML for browser requests", () => {
    expect(
      markdownNegotiationResponse(request(browserAccept), resolver),
    ).toBeNull();
  });

  test("does not intercept non-GET methods", () => {
    expect(
      markdownNegotiationResponse(request("text/markdown", "POST"), resolver),
    ).toBeNull();
  });

  test("falls through when no Markdown content exists for the path", () => {
    expect(
      markdownNegotiationResponse(
        request("text/markdown", "GET", "/dashboard"),
        resolver,
      ),
    ).toBeNull();
  });

  test("falls through when the resolver has no matching content", () => {
    expect(
      markdownNegotiationResponse(
        request("text/markdown", "GET", "/help/missing"),
        resolver,
      ),
    ).toBeNull();
  });

  test("answers HEAD requests with headers only", async () => {
    const response = markdownNegotiationResponse(
      request("text/markdown", "HEAD"),
      resolver,
    );

    expect(response?.status).toBe(200);
    expect(await response?.text()).toBe("");
  });
});

describe("toMarkdownDocument", () => {
  test("prepends the title as the heading", () => {
    expect(toMarkdownDocument("Hello World!", "Welcome to Mosaic.")).toBe(
      "# Hello World!\n\nWelcome to Mosaic.\n",
    );
  });

  test("does not duplicate an existing title heading", () => {
    expect(
      toMarkdownDocument("Managing Your Subscription", "# Subscription\n\nBody."),
    ).toBe("# Managing Your Subscription\n\nBody.\n");
  });
});
