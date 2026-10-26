import { beforeEach, describe, expect, spyOn, test } from "bun:test";

import {
  BrowserRunHttpError,
  screenshotWithEngineFallback,
  screenshotWithRetry,
} from "./screenshot-retry";

const okImage = (byte: number) =>
  new Response(new Uint8Array([byte]).buffer, { status: 200 });

const state = {
  calls: 0,
  outcomes: [] as Array<Error | Response>,
};

const quickAction = async () => {
  state.calls += 1;
  const outcome = state.outcomes.shift() ?? okImage(1);
  if (outcome instanceof Error) {
    throw outcome;
  }
  return outcome;
};

const options = { url: "https://example.com" } as BrowserRunScreenshotOptions;

beforeEach(() => {
  state.calls = 0;
  state.outcomes = [];
});

describe("screenshotWithRetry", () => {
  test("returns the image on the first attempt when Browser Run answers", async () => {
    state.outcomes = [okImage(9)];
    const image = await screenshotWithRetry(quickAction, options);
    expect(image.byteLength).toBe(1);
    expect(state.calls).toBe(1);
  });

  test("retries a transient binding failure once and returns the image", async () => {
    state.outcomes = [new Error(""), okImage(9)];
    const image = await screenshotWithRetry(quickAction, options);
    expect(image.byteLength).toBe(1);
    expect(state.calls).toBe(2);
  });

  test("gives up after one retry when Browser Run keeps failing", async () => {
    state.outcomes = [new Error(""), new Error("")];
    await expect(screenshotWithRetry(quickAction, options)).rejects.toThrow();
    expect(state.calls).toBe(2);
  });

  test("retries a 429 answer from Browser Run", async () => {
    state.outcomes = [new Response("slow down", { status: 429 }), okImage(7)];
    const image = await screenshotWithRetry(quickAction, options);
    expect(image.byteLength).toBe(1);
    expect(state.calls).toBe(2);
  });

  test("does not retry a 4xx answer other than 429", async () => {
    state.outcomes = [new Response("bad options", { status: 400 })];
    await expect(screenshotWithRetry(quickAction, options)).rejects.toThrow(
      "Browser Run returned 400",
    );
    expect(state.calls).toBe(1);
  });
});

describe("BrowserRunHttpError", () => {
  test("rejects a 4xx answer with a typed error carrying the status", async () => {
    state.outcomes = [new Response("bad options", { status: 400 })];
    const rejection = screenshotWithRetry(quickAction, options);
    await expect(rejection).rejects.toBeInstanceOf(BrowserRunHttpError);
    await expect(rejection).rejects.toMatchObject({ status: 400 });
  });

  test("rejects with the last status when 5xx answers exhaust the retry", async () => {
    state.outcomes = [
      new Response("broken", { status: 500 }),
      new Response("still broken", { status: 503 }),
    ];
    const rejection = screenshotWithRetry(quickAction, options);
    await expect(rejection).rejects.toMatchObject({ status: 503 });
    expect(state.calls).toBe(2);
  });
});

describe("recovered failure logging", () => {
  test("warns once when the first attempt fails and the retry recovers", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    state.outcomes = [new Error(""), okImage(9)];
    await screenshotWithRetry(quickAction, options);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("warns once when a retryable answer precedes the image", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    state.outcomes = [new Response("slow down", { status: 429 }), okImage(7)];
    await screenshotWithRetry(quickAction, options);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("does not warn when a 4xx fails without a retry", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    state.outcomes = [new Response("bad options", { status: 400 })];
    await expect(screenshotWithRetry(quickAction, options)).rejects.toThrow();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("screenshotWithEngineFallback", () => {
  const kitesurfOptions = {
    url: "https://example.com",
    browser: "kitesurf",
  } as BrowserRunScreenshotOptions;

  const calls: BrowserRunScreenshotOptions[] = [];

  const recordingQuickAction = async (
    _action: "screenshot",
    options: BrowserRunScreenshotOptions,
  ) => {
    calls.push({ ...options });
    return quickAction();
  };

  beforeEach(() => {
    calls.length = 0;
  });

  test("falls back to the default engine when Kitesurf keeps failing", async () => {
    state.outcomes = [new Error(""), new Error(""), okImage(5)];
    const image = await screenshotWithEngineFallback(
      recordingQuickAction,
      kitesurfOptions,
    );
    expect(image.byteLength).toBe(1);
    expect(calls).toHaveLength(3);
    expect(calls[0]).toHaveProperty("browser", "kitesurf");
    expect(calls[2]).not.toHaveProperty("browser");
  });

  test("recovers within the Kitesurf attempts without touching the fallback", async () => {
    state.outcomes = [new Error(""), okImage(5)];
    const image = await screenshotWithEngineFallback(
      recordingQuickAction,
      kitesurfOptions,
    );
    expect(image.byteLength).toBe(1);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toHaveProperty("browser", "kitesurf");
  });

  test("falls back when Kitesurf rejects the options with a 4xx", async () => {
    state.outcomes = [new Response("bad engine", { status: 422 }), okImage(5)];
    const image = await screenshotWithEngineFallback(
      recordingQuickAction,
      kitesurfOptions,
    );
    expect(image.byteLength).toBe(1);
    expect(calls).toHaveLength(2);
    expect(calls[1]).not.toHaveProperty("browser");
  });

  test("surfaces the default engine's error when both engines fail", async () => {
    state.outcomes = [
      new Error("kitesurf down"),
      new Error("kitesurf down"),
      new Response("chromium broken", { status: 500 }),
      new Response("chromium still broken", { status: 500 }),
    ];
    await expect(
      screenshotWithEngineFallback(recordingQuickAction, kitesurfOptions),
    ).rejects.toMatchObject({ status: 500 });
    expect(calls).toHaveLength(4);
  });

  test("does not fall back when the default engine is already in use", async () => {
    state.outcomes = [new Error(""), new Error("")];
    await expect(
      screenshotWithEngineFallback(recordingQuickAction, options),
    ).rejects.toThrow();
    expect(calls).toHaveLength(2);
  });
});
