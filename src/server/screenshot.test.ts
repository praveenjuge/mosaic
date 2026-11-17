import { resetWorkerRuntime, testEnv } from "@/testing/worker-runtime";
import { afterEach, describe, expect, test } from "bun:test";
import {
  isMosaicRendererRequest,
  MOSAIC_RENDERER_USER_AGENT,
  takeScreenshot,
} from "./screenshot";

afterEach(resetWorkerRuntime);

describe("takeScreenshot", () => {
  test("calls Browser Run without detaching quickAction from the RPC stub", async () => {
    // On the production binding, reading `.bind` (or any unknown property)
    // from a method is itself an RPC call and throws. This stand-in does the
    // same, so `quickAction.bind(env.BROWSER)` cannot come back unnoticed.
    const calls: Array<{ action: string; options: { browser?: string } }> = [];
    const quickAction = new Proxy(
      async (action: string, options: { browser?: string }) => {
        calls.push({ action, options });
        return new Response(new TextEncoder().encode("jpeg"));
      },
      {
        get(target, prop, receiver) {
          if (prop === "bind") {
            throw new TypeError(
              'The RPC receiver does not implement the method "bind".',
            );
          }
          return Reflect.get(target, prop, receiver);
        },
      },
    );
    testEnv.BROWSER = { quickAction };

    const image = await takeScreenshot("https://example.com/");

    expect(new TextDecoder().decode(image)).toBe("jpeg");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.action).toBe("screenshot");
    expect(calls[0]?.options.browser).toBe("kitesurf");
  });
});

describe("renderer marker", () => {
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

  test("keeps a browser-compatible desktop Chromium identity", () => {
    expect(MOSAIC_RENDERER_USER_AGENT).toContain("Mozilla/5.0");
    expect(MOSAIC_RENDERER_USER_AGENT).toContain("Chrome/");
  });

  test("keeps ordinary and metadata-free public requests usable", () => {
    const request = new Request("https://mosaic.example/use");

    expect(isMosaicRendererRequest(request)).toBe(false);
  });
});
