import { describe, expect, test } from "bun:test";
import {
  acceptsHtml,
  negotiateResponse,
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

  test("prefers the most specific range over a wildcard", () => {
    expect(prefersMarkdown("text/markdown;q=0.8, text/html;q=0, */*;q=1")).toBe(
      true,
    );
  });

  test("lets a wildcard HTML range beat weaker Markdown", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, text/*;q=0.9")).toBe(false);
  });

  test("prefers Markdown over a weaker specific HTML range", () => {
    expect(
      prefersMarkdown("text/markdown;q=0.5, text/html;q=0.4, */*;q=0.9"),
    ).toBe(true);
  });
});

describe("acceptsHtml", () => {
  test("accepts HTML and full wildcard ranges", () => {
    expect(acceptsHtml(browserAccept)).toBe(true);
    expect(acceptsHtml("*/*")).toBe(true);
    expect(acceptsHtml(null)).toBe(true);
  });

  test("rejects a text wildcard, which the SSR handler turns into a 500", () => {
    expect(acceptsHtml("text/*")).toBe(false);
  });

  test("honors an explicit text wildcard refusal", () => {
    expect(acceptsHtml("text/*;q=0, */*")).toBe(false);
  });

  test("rejects JSON, plain text, and zero-quality HTML", () => {
    expect(acceptsHtml("application/json")).toBe(false);
    expect(acceptsHtml("text/plain")).toBe(false);
    expect(acceptsHtml("text/html;q=0, */*")).toBe(false);
  });
});

describe("negotiateResponse", () => {
  const pages = {
    "/": "# Mosaic\n",
    "/help": "# Help\n",
    "/help/hello-world": "# Hello\n",
  };

  function get(path: string, accept: string | null, method = "GET") {
    return new Request(`https://mosaic.example${path}`, {
      headers: accept === null ? {} : { Accept: accept },
      method,
    });
  }

  async function problemCode(response: Response | null) {
    return ((await response?.json()) as { code: string }).code;
  }

  test("serves Markdown for a content page instead of the SSR 500", async () => {
    const response = negotiateResponse(get("/", "text/markdown"), pages);

    expect(response?.status).toBe(200);
    expect(response?.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");
    expect(await response?.text()).toBe("# Mosaic\n");
  });

  test("decodes encoded paths and tolerates a trailing slash", async () => {
    for (const path of ["/help/hello%2Dworld", "/help/hello-world/"]) {
      const response = negotiateResponse(get(path, "text/markdown"), pages);
      expect(await response?.text()).toBe("# Hello\n");
    }
  });

  test("answers a useful Markdown 404 for an unknown public page", async () => {
    for (const path of [
      "/missing",
      "/help/missing",
      "/help/guides",
      "/api/x",
    ]) {
      const response = negotiateResponse(get(path, "text/markdown"), pages);
      expect(response?.status).toBe(404);
      expect(response?.headers.get("Content-Type")).toBe(
        "text/markdown; charset=utf-8",
      );
      expect(await response?.text()).toContain("https://mosaic.example/help");
    }
  });

  test("uses the configured origin for recovery links", async () => {
    const response = negotiateResponse(
      get("/missing", "text/markdown"),
      pages,
      "https://mosaic.praveenjuge.com",
    );
    const body = await response?.text();
    expect(body).toContain("https://mosaic.praveenjuge.com/help");
    expect(body).not.toContain("mosaic.example/help");
  });

  test("answers an unknown page asked for as JSON with a 404 problem", async () => {
    const response = negotiateResponse(get("/nope", "application/json"), pages);

    expect(response?.status).toBe(404);
    expect(response?.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");
    expect(await problemCode(response)).toBe("not_found");
    expect(negotiateResponse(get("/api", "text/plain"), pages)?.status).toBe(
      404,
    );
    expect(negotiateResponse(get("/_missing", "text/*"), pages)?.status).toBe(
      404,
    );
  });

  test("answers a known page asked for as JSON with a 406 problem", async () => {
    for (const path of ["/", "/help", "/help/"]) {
      const response = negotiateResponse(get(path, "application/json"), pages);
      expect(response?.status).toBe(406);
      expect(await problemCode(response)).toBe("not_acceptable");
    }
  });

  test("sends no body for HEAD", async () => {
    const markdown = negotiateResponse(
      get("/", "text/markdown", "HEAD"),
      pages,
    );
    expect(markdown?.status).toBe(200);
    expect(await markdown?.text()).toBe("");

    const problem = negotiateResponse(
      get("/nope", "application/json", "HEAD"),
      pages,
    );
    expect(problem?.status).toBe(404);
    expect(await problem?.text()).toBe("");
  });

  test("leaves requests that can take HTML alone", () => {
    for (const accept of [browserAccept, "*/*", null, "text/html,*/*;q=0.8"]) {
      expect(negotiateResponse(get("/nope", accept), pages)).toBeNull();
    }
  });

  test("leaves app routes, assets, and non-GET requests alone", () => {
    for (const path of [
      "/dashboard",
      "/dashboard/missing",
      "/i/global/a.jpeg",
      "/blog/missing",
      "/sign-in",
      "/_serverFn/abc123",
      "/llms.txt",
      "/missing.png",
    ]) {
      expect(negotiateResponse(get(path, "text/markdown"), pages)).toBeNull();
      expect(
        negotiateResponse(get(path, "application/json"), pages),
      ).toBeNull();
    }
    expect(
      negotiateResponse(get("/", "text/markdown", "POST"), pages),
    ).toBeNull();
  });
});

describe("toMarkdownDocument", () => {
  test("prepends the title as the heading", () => {
    expect(toMarkdownDocument("Hello World!", "Welcome to Mosaic.")).toBe(
      "# Hello World!\n\nWelcome to Mosaic.\n",
    );
  });

  test("removes a source heading that repeats the title", () => {
    expect(
      toMarkdownDocument(
        "Managing Your Subscription",
        "# Managing Your Subscription\n\nBody.",
      ),
    ).toBe("# Managing Your Subscription\n\nBody.\n");
  });

  test("keeps an opening section heading that is not the title", () => {
    expect(
      toMarkdownDocument("React", "## In React 19+, render meta tags\n\nBody."),
    ).toBe("# React\n\n## In React 19+, render meta tags\n\nBody.\n");
  });

  test("keeps a source heading that differs from the title", () => {
    expect(
      toMarkdownDocument(
        "Managing Your Subscription",
        "# Subscription\n\nBody.",
      ),
    ).toBe("# Managing Your Subscription\n\n# Subscription\n\nBody.\n");
  });
});
