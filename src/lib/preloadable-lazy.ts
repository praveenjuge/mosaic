import { lazy, type ComponentType } from "react";

/**
 * `React.lazy` with a `preload()` for route loaders. Once preloaded, the
 * component renders without suspending, so a client navigation shows it in
 * the same commit instead of flashing its Suspense fallback. Before that
 * (during hydration), it suspends like any lazy component.
 */
export function preloadableLazy<Props extends object>(
  load: () => Promise<{ default: ComponentType<Props> }>,
) {
  let loaded: { default: ComponentType<Props> } | undefined;
  const preload = async () => {
    loaded ??= await load();
  };
  const Component = lazy(() => {
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
  return { Component, preload };
}
