import { describe, expect, mock, test } from "bun:test";

// The production BROWSER binding is an RPC stub: reading `.bind` (or any
// unknown method) on one of its methods is itself an RPC call and fails with
// "The RPC receiver does not implement the method ...". This stand-in has the
// same behaviour, so the wiring in `takeScreenshot` cannot go back to
// `env.BROWSER.quickAction.bind(...)` without failing here.
const state = {
  calls: [] as Array<{ action: string; options: Record<string, unknown> }>,
};

mock.module("cloudflare:workers", () => ({
  env: {
    BROWSER: {
      quickAction: new Proxy(
        async (action: string, options: Record<string, unknown>) => {
          state.calls.push({ action, options });
          return new Response(new TextEncoder().encode("jpeg").buffer);
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
      ),
    },
  },
  waitUntil: () => {},
}));

const { takeScreenshot } = await import("./screenshot");

describe("takeScreenshot", () => {
  test("invokes quickAction through a local closure, not .bind() on the RPC stub", async () => {
    const image = await takeScreenshot("https://example.com/");
    expect(new TextDecoder().decode(image)).toBe("jpeg");
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0]?.action).toBe("screenshot");
    expect(state.calls[0]?.options.browser).toBe("kitesurf");
  });
});
