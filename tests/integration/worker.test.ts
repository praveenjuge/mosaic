/**
 * Integration tests against the built Worker running in workerd, with local
 * D1 and R2. Run `bun run build` first, then `bun run test:integration`.
 *
 * These use `node --test` because wrangler's test harness relies on undici
 * behaviour that Bun's fetch shim does not provide.
 */

import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { createTestHarness } from "wrangler";

// Browser Run is remote-only in the built config. Strip the flag so the
// harness runs fully offline; screenshots then fail like a Browser Run outage.
const builtConfig = JSON.parse(
  readFileSync("./dist/server/wrangler.json", "utf8"),
);
delete builtConfig.browser?.remote;
writeFileSync("./dist/server/wrangler.test.json", JSON.stringify(builtConfig));

const server = createTestHarness({
  workers: [
    {
      configPath: "./dist/server/wrangler.test.json",
      secrets: { CLERK_SECRET_KEY: "clerk-secret-placeholder" },
    },
  ],
});
const worker = server.getWorker<Cloudflare.Env>();

before(async () => {
  await server.listen();
});

beforeEach(async () => {
  await server.reset();
  await worker.applyD1Migrations("DB");
});

after(async () => {
  await server.close();
});

async function registerSite(urlBase: string) {
  const env = await worker.getEnv();
  await env.DB.prepare(
    "INSERT INTO sites (user_id, url_base, r2_prefix) VALUES (?, ?, ?)",
  )
    .bind("user_test", urlBase, `user_test/${urlBase}`)
    .run();
}

describe("public pages", () => {
  test("serves robots.txt", async () => {
    const response = await server.fetch("/robots.txt");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Sitemap:/);
  });

  test("sets security headers on Worker responses", async () => {
    const response = await server.fetch("/robots.txt");
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
    assert.match(
      response.headers.get("Content-Security-Policy") ?? "",
      /frame-ancestors 'none'/,
    );
  });
});

describe("/use", () => {
  test("requires a url parameter", async () => {
    const response = await server.fetch("/use");
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "URL parameter is required",
    });
  });

  test("refuses websites that have not been added", async () => {
    const response = await server.fetch("/use?url=https://example.com/");
    assert.equal(response.status, 404);
  });

  test("falls back to the example image when Browser Run fails", async () => {
    await registerSite("example.com");

    const response = await server.fetch("/use?url=https://example.com/", {
      redirect: "manual",
    });
    assert.equal(response.status, 307);
    assert.match(
      response.headers.get("Location") ?? "",
      /\/images\/mosaic-example-og-[0-9a-f]+\.png$/,
    );
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  });

  test("redirects to a fresh cached image without a new screenshot", async () => {
    await registerSite("example.com");
    const env = await worker.getEnv();
    await env.DB.prepare(
      "INSERT INTO global_images (page_url, hostname, key, size_in_bytes, generated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(
        "https://example.com",
        "example.com",
        "global/cached.jpeg",
        3,
        Date.now(),
        Date.now() + 60_000,
      )
      .run();

    const response = await server.fetch("/use?url=https://example.com/", {
      redirect: "manual",
    });
    assert.equal(response.status, 307);
    assert.match(
      response.headers.get("Location") ?? "",
      /\/i\/global\/cached\.jpeg$/,
    );
  });
});

describe("/i/*", () => {
  test("serves stored images from R2", async () => {
    const env = await worker.getEnv();
    await env.OG_BUCKET.put("global/test.jpeg", new Uint8Array([1, 2, 3]), {
      httpMetadata: { contentType: "image/jpeg" },
    });

    const response = await server.fetch("/i/global/test.jpeg");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/jpeg");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(
      new Uint8Array(await response.arrayBuffer()),
      new Uint8Array([1, 2, 3]),
    );
  });

  test("returns 404 for missing images", async () => {
    const response = await server.fetch("/i/global/missing.jpeg");
    assert.equal(response.status, 404);
  });
});
