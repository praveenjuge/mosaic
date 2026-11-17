/**
 * Bun test preload (`bunfig.toml`): stands in for the Workers runtime, which
 * Bun doesn't have. `cloudflare:workers` resolves to `testEnv` and a
 * `waitUntil` that collects background work, and `caches` is an in-memory
 * Cache API. Tests set the bindings they use on `testEnv` and call
 * `resetWorkerRuntime()` before each test.
 */

import { mock } from "bun:test";

export const testEnv: Record<string, unknown> = {};

const backgroundWork: Promise<unknown>[] = [];

mock.module("cloudflare:workers", () => ({
  env: testEnv,
  waitUntil: (promise: Promise<unknown>) => {
    backgroundWork.push(promise);
  },
}));

/** Waits for everything passed to `waitUntil` so far. */
export async function settleBackgroundWork(): Promise<void> {
  while (backgroundWork.length > 0) {
    await Promise.allSettled(backgroundWork.splice(0));
  }
}

type Stored = { body: ArrayBuffer; init: ResponseInit };
const cacheStores = new Map<string, Map<string, Stored>>();

function cacheStore(name: string): Map<string, Stored> {
  let store = cacheStores.get(name);
  if (!store) cacheStores.set(name, (store = new Map()));
  return store;
}

const keyOf = (request: RequestInfo | URL) =>
  request instanceof Request ? request.url : String(request);

globalThis.caches = {
  open: async (name: string) => {
    const store = cacheStore(name);
    return {
      match: async (request: RequestInfo | URL) => {
        const stored = store.get(keyOf(request));
        return stored
          ? new Response(stored.body.slice(0), stored.init)
          : undefined;
      },
      put: async (request: RequestInfo | URL, response: Response) => {
        store.set(keyOf(request), {
          body: await response.arrayBuffer(),
          init: { status: response.status, headers: response.headers },
        });
      },
      delete: async (request: RequestInfo | URL) =>
        store.delete(keyOf(request)),
    };
  },
} as unknown as CacheStorage;

export function resetWorkerRuntime(): void {
  for (const key of Object.keys(testEnv)) delete testEnv[key];
  backgroundWork.length = 0;
  cacheStores.clear();
}
