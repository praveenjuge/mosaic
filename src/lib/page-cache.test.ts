import { describe, expect, test } from "bun:test";
import {
  isCacheablePageRequest,
  isCacheablePageResponse,
  pageCacheKey,
} from "./page-cache";

const liveKey = "pk_live_placeholder";

function request(path: string, init?: RequestInit) {
  return new Request(`https://mosaic.example${path}`, init);
}

describe("isCacheablePageRequest", () => {
  test("allows signed-out GETs of content pages", () => {
    for (const path of [
      "/",
      "/legal",
      "/help",
      "/help/use-the-mosaic-api",
      "/help/guides/nextjs",
    ]) {
      expect(isCacheablePageRequest(request(path), liveKey)).toBe(true);
    }
    expect(
      isCacheablePageRequest(
        request("/", { headers: { Cookie: "__client_uat=0; theme=dark" } }),
        liveKey,
      ),
    ).toBe(true);
  });

  test("skips anything that might be signed in", () => {
    for (const cookie of [
      "__session=abc",
      "__session_Xy12=abc",
      "__client_uat=1760000000",
      "__client_uat_Xy12=1760000000",
      "__clerk_db_jwt=abc",
    ]) {
      expect(
        isCacheablePageRequest(
          request("/", { headers: { Cookie: cookie } }),
          liveKey,
        ),
      ).toBe(false);
    }
    expect(
      isCacheablePageRequest(
        request("/", { headers: { Authorization: "Bearer abc" } }),
        liveKey,
      ),
    ).toBe(false);
  });

  test("skips other paths, methods, queries, and development keys", () => {
    for (const path of [
      "/sign-in",
      "/use",
      "/i/global/a.jpeg",
      "/help/guides/nextjs/extra",
      "/_serverFn/abc",
      "/?__clerk_handshake=abc",
      "/help?utm_source=x",
    ]) {
      expect(isCacheablePageRequest(request(path), liveKey)).toBe(false);
    }
    expect(
      isCacheablePageRequest(request("/", { method: "HEAD" }), liveKey),
    ).toBe(false);
    expect(isCacheablePageRequest(request("/"), "pk_test_abc")).toBe(false);
  });
});

describe("isCacheablePageResponse", () => {
  const html = { "Content-Type": "text/html; charset=utf-8" };

  test("stores only plain 200 HTML", () => {
    expect(isCacheablePageResponse(new Response("", { headers: html }))).toBe(
      true,
    );
    expect(
      isCacheablePageResponse(new Response("", { status: 404, headers: html })),
    ).toBe(false);
    expect(
      isCacheablePageResponse(
        new Response("", { headers: { ...html, "Set-Cookie": "a=b" } }),
      ),
    ).toBe(false);
    expect(
      isCacheablePageResponse(
        new Response("", { headers: { "Content-Type": "text/markdown" } }),
      ),
    ).toBe(false);
  });
});

describe("pageCacheKey", () => {
  test("keys on origin, path, and build", () => {
    expect(pageCacheKey(request("/help"), "b1").url).toBe(
      "https://mosaic.example/help?build=b1",
    );
  });
});
