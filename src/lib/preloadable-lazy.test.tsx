import { describe, expect, test } from "bun:test";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { preloadableLazy } from "./preloadable-lazy";

function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}

function render(Component: (props: { name: string }) => React.ReactNode) {
  return renderToString(
    <Suspense fallback={<p>loading</p>}>
      <Component name="Ada" />
    </Suspense>,
  );
}

describe("preloadableLazy", () => {
  test("suspends before the module is loaded", () => {
    const { Component } = preloadableLazy(async () => ({ default: Greeting }));
    expect(render(Component)).toContain("loading");
  });

  test("renders without suspending once preloaded", async () => {
    let loads = 0;
    const { Component, preload } = preloadableLazy(async () => {
      loads++;
      return { default: Greeting };
    });
    await preload();
    await preload();
    expect(render(Component)).toContain("Hello <!-- -->Ada");
    expect(loads).toBe(1);
  });
});
