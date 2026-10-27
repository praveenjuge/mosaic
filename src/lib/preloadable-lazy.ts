import { createElement, lazy, type ComponentType } from "react";
import { preload as preloadResource } from "react-dom";

let chunkFiles: Record<string, string[]> = {};

/**
 * The client files each lazily imported module needs, from
 * `virtual:mosaic-lazy-chunks` (see `src/lib/lazy-chunks-plugin.ts`). The
 * Worker entry registers them; development and tests have none.
 */
export function registerLazyChunks(files: Record<string, string[]>) {
  chunkFiles = files;
}

/**
 * `React.lazy` with a `preload()` for route loaders. Once preloaded, the
 * component renders without suspending, so a client navigation shows it in
 * the same commit instead of flashing its Suspense fallback. Before that
 * (during hydration), it suspends like any lazy component.
 *
 * `chunk` names the imported module's file (like
 * `src/components/dashboard/dashboard-page.tsx`). When the server renders
 * the component, it sends preload links for that module's client files, so
 * the browser fetches them with the page's own scripts. Otherwise they wait
 * for hydration to ask for them, and a Clerk update that arrives first makes
 * React drop the server HTML until they load. Like Start's own script
 * preloads, they're low priority, behind the stylesheet and font; with
 * `crossorigin`, the module loader reuses them.
 */
export function preloadableLazy<Props extends object>(
  load: () => Promise<{ default: ComponentType<Props> }>,
  chunk?: string,
) {
  let loaded: { default: ComponentType<Props> } | undefined;
  const preload = async () => {
    loaded ??= await load();
  };
  const Lazy = lazy(() => {
    const module = loaded;
    // React.lazy marks the module resolved when `then` calls back at once.
    if (module) {
      const resolved: PromiseLike<typeof module> = {
        then: (resolve) => resolve?.(module) as never,
      };
      return resolved as Promise<typeof module>;
    }
    return load().then((result) => (loaded = result));
  });
  const Component = (props: Props) => {
    if (typeof window === "undefined" && chunk) {
      for (const href of chunkFiles[chunk] ?? []) {
        preloadResource(href, {
          as: "script",
          crossOrigin: "anonymous",
          fetchPriority: "low",
        });
      }
    }
    return createElement(Lazy as ComponentType<Props>, props);
  };
  return { Component, preload };
}
