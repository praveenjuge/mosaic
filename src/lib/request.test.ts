import { describe, expect, test } from "bun:test";
import {
  isDocumentNavigation,
  shouldRejectUseDocumentNavigation,
} from "./request";

describe("request intent", () => {
  test.each([
    ["navigate", "empty"],
    ["no-cors", "document"],
    ["navigate", "document"],
  ])("recognizes document navigation mode=%s dest=%s", (mode, destination) => {
    const request = new Request("https://mosaic.example/use", {
      headers: {
        "Sec-Fetch-Mode": mode,
        "Sec-Fetch-Dest": destination,
      },
    });

    expect(isDocumentNavigation(request)).toBe(true);
  });

  test("does not classify an image subresource as a document navigation", () => {
    const request = new Request("https://mosaic.example/use", {
      headers: {
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Dest": "image",
      },
    });

    expect(isDocumentNavigation(request)).toBe(false);
  });

  test("does not infer intent when optional Fetch Metadata is absent", () => {
    const request = new Request("https://mosaic.example/use");

    expect(isDocumentNavigation(request)).toBe(false);
  });

  test("rejects anonymous documents but permits signed-in previews", () => {
    const request = new Request("https://mosaic.example/use", {
      headers: {
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "document",
      },
    });

    expect(shouldRejectUseDocumentNavigation(request, false)).toBe(true);
    expect(shouldRejectUseDocumentNavigation(request, true)).toBe(false);
  });
});
