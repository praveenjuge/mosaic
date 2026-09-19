import { describe, expect, test } from "bun:test";
import { addAcceptToVary } from "./vary";

function headers(contentType: string, vary?: string) {
  return new Headers({
    "Content-Type": contentType,
    ...(vary ? { Vary: vary } : {}),
  });
}

describe("addAcceptToVary", () => {
  test("adds Accept to negotiable responses", () => {
    const responseHeaders = headers("text/html; charset=utf-8");

    addAcceptToVary(responseHeaders);

    expect(responseHeaders.get("Vary")).toBe("Accept");
  });

  test("preserves existing Vary values", () => {
    const responseHeaders = headers("application/json", "Origin");

    addAcceptToVary(responseHeaders);

    expect(responseHeaders.get("Vary")).toBe("Origin, Accept");
  });

  test("does not duplicate Accept with different casing", () => {
    const responseHeaders = headers("text/markdown", "Origin, accept");

    addAcceptToVary(responseHeaders);

    expect(responseHeaders.get("Vary")).toBe("Origin, accept");
  });

  test("keeps a wildcard Vary header unchanged", () => {
    const responseHeaders = headers("text/html", "*");

    addAcceptToVary(responseHeaders);

    expect(responseHeaders.get("Vary")).toBe("*");
  });

  test("does not vary non-negotiable assets", () => {
    const responseHeaders = headers("image/png");

    addAcceptToVary(responseHeaders);

    expect(responseHeaders.get("Vary")).toBeNull();
  });
});
