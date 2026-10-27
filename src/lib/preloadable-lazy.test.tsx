import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { preloadableLazy, registerLazyChunks } from "./preloadable-lazy";

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

  test("preloads its chunk's files when the server renders it", async () => {
    registerLazyChunks({
      "src/greeting.tsx": ["/assets/greeting.js", "/assets/shared.js"],
    });
    const { Component, preload } = preloadableLazy(
      async () => ({ default: Greeting }),
      "src/greeting.tsx",
    );
    await preload();
    const html = renderToString(
      <html>
        <head />
        <body>
          <Component name="Ada" />
        </body>
      </html>,
    );
    for (const href of ["/assets/greeting.js", "/assets/shared.js"]) {
      expect(html).toContain(
        `<link rel="preload" href="${href}" as="script" crossorigin="" fetchPriority="low"/>`,
      );
    }
    registerLazyChunks({});
  });

  test("names chunks that exist, matching what each call imports", async () => {
    const calls = [];
    for await (const file of new Bun.Glob("src/**/*.{ts,tsx}").scan()) {
      const source = readFileSync(file, "utf8");
      const pattern =
        /preloadableLazy\(\s*\(\) => import\("@\/([^"]+)"\),\s*"([^"]+)"/g;
      for (const [, imported, chunk] of source.matchAll(pattern)) {
        calls.push(chunk);
        expect(existsSync(chunk)).toBe(true);
        expect(chunk.replace(/\.tsx?$/, "")).toBe(`src/${imported}`);
      }
    }
    expect(calls.length).toBeGreaterThan(0);
  });
});
