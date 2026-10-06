import { describe, expect, test } from "bun:test";
import { nonHtmlErrorResponse } from "./json-errors";
import { acceptsHtml, type MarkdownContentRef } from "./markdown-negotiation";

const resolve = (ref: MarkdownContentRef) =>
  ref.kind === "home" ? "# Home\n" : null;

function get(path: string, accept: string | null, method = "GET") {
  return new Request(`https://mosaic.example${path}`, {
    headers: accept === null ? {} : { Accept: accept },
    method,
  });
}

describe("acceptsHtml", () => {
  test("accepts HTML and full wildcard ranges", () => {
    expect(acceptsHtml("text/html")).toBe(true);
    expect(acceptsHtml("*/*")).toBe(true);
    expect(acceptsHtml(null)).toBe(true);
  });

  test("rejects a text wildcard, which the SSR handler turns into a 500", () => {
    expect(acceptsHtml("text/*")).toBe(false);
  });

  test("honors an explicit text wildcard refusal", () => {
    expect(acceptsHtml("text/*;q=0, */*;q=1")).toBe(false);
    expect(acceptsHtml("text/html, text/*;q=0")).toBe(true);
  });

  test("rejects JSON, plain text, and zero-quality HTML", () => {
    expect(acceptsHtml("application/json")).toBe(false);
    expect(acceptsHtml("text/plain")).toBe(false);
    expect(acceptsHtml("text/html;q=0, */*;q=0.5")).toBe(false);
  });
});

describe("nonHtmlErrorResponse", () => {
  test("answers an unknown page asked for as JSON with a 404 problem", async () => {
    const response = nonHtmlErrorResponse(
      get("/nope", "application/json"),
      resolve,
    );

    expect(response?.status).toBe(404);
    expect(response?.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");

    const body = await response?.json();
    expect(body.code).toBe("not_found");
    expect(body.resolution).toContain("https://mosaic.example/help");
  });

  test("answers unknown /api URLs with a 404 problem", () => {
    expect(
      nonHtmlErrorResponse(get("/api/v1/cards", "text/plain"), resolve)?.status,
    ).toBe(404);
    expect(
      nonHtmlErrorResponse(get("/api", "application/json"), resolve)?.status,
    ).toBe(404);
  });

  test("answers a known page asked for as JSON with a 406 problem", async () => {
    const response = nonHtmlErrorResponse(
      get("/", "application/json"),
      resolve,
    );

    expect(response?.status).toBe(406);
    expect((await response?.json()).code).toBe("not_acceptable");
  });

  test("answers the help index with a 406 problem", async () => {
    const response = nonHtmlErrorResponse(
      get("/help", "application/json"),
      resolve,
    );

    expect(response?.status).toBe(406);
    expect((await response?.json()).code).toBe("not_acceptable");
    expect(
      nonHtmlErrorResponse(get("/help/", "application/json"), resolve)?.status,
    ).toBe(406);
  });

  test("answers a text wildcard request instead of reaching SSR", () => {
    expect(nonHtmlErrorResponse(get("/nope", "text/*"), resolve)?.status).toBe(
      404,
    );
  });

  test("passes framework server-function calls through", () => {
    expect(
      nonHtmlErrorResponse(
        get("/_serverFn/abc123", "application/json"),
        resolve,
      ),
    ).toBeNull();
  });

  test("answers unknown underscore pages with a 404 problem", () => {
    expect(
      nonHtmlErrorResponse(get("/_missing", "application/json"), resolve)
        ?.status,
    ).toBe(404);
  });

  test("sends no body for HEAD", async () => {
    const response = nonHtmlErrorResponse(
      get("/nope", "application/json", "HEAD"),
      resolve,
    );

    expect(response?.status).toBe(404);
    expect(await response?.text()).toBe("");
  });

  test("leaves requests that can take HTML alone", () => {
    expect(nonHtmlErrorResponse(get("/nope", "*/*"), resolve)).toBeNull();
    expect(nonHtmlErrorResponse(get("/nope", null), resolve)).toBeNull();
    expect(
      nonHtmlErrorResponse(get("/nope", "text/html,*/*;q=0.8"), resolve),
    ).toBeNull();
  });

  test("leaves Markdown requests to the Markdown handler", () => {
    expect(
      nonHtmlErrorResponse(get("/nope", "text/markdown"), resolve),
    ).toBeNull();
  });

  test("leaves app routes, assets, and non-GET requests alone", () => {
    expect(
      nonHtmlErrorResponse(get("/dashboard", "application/json"), resolve),
    ).toBeNull();
    expect(
      nonHtmlErrorResponse(get("/llms.txt", "application/json"), resolve),
    ).toBeNull();
    expect(
      nonHtmlErrorResponse(get("/nope", "application/json", "POST"), resolve),
    ).toBeNull();
  });
});
