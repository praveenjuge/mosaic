import { describe, expect, test } from "bun:test";
import { isMosaicRendererRequest, MOSAIC_RENDERER_USER_AGENT } from "./request";

describe("request intent", () => {
  test("recognizes Mosaic's Browser Run deny marker", () => {
    const request = new Request("https://mosaic.example/use", {
      headers: {
        "User-Agent": MOSAIC_RENDERER_USER_AGENT,
      },
    });

    expect(isMosaicRendererRequest(request)).toBe(true);
  });

  test("recognizes the marker when a runtime appends browser details", () => {
    const request = new Request("https://mosaic.example/use", {
      headers: {
        "User-Agent": `${MOSAIC_RENDERER_USER_AGENT} Chromium/140`,
      },
    });

    expect(isMosaicRendererRequest(request)).toBe(true);
  });

  test("keeps ordinary and metadata-free public requests usable", () => {
    const request = new Request("https://mosaic.example/use");

    expect(isMosaicRendererRequest(request)).toBe(false);
  });
});
