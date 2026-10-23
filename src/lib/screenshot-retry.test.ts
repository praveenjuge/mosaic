import { beforeEach, describe, expect, test } from "bun:test";

import { BrowserRunHttpError, screenshotWithRetry } from "./screenshot-retry";

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
