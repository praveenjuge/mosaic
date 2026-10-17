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

async function insertGlobalImage(key: string, expiresAt: number) {
  const env = await worker.getEnv();
  await env.DB.prepare(
    "INSERT INTO global_images (page_url, hostname, key, size_in_bytes, generated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind("https://example.com", "example.com", key, 3, Date.now(), expiresAt)
    .run();
}

const pageHash = "a".repeat(64);

async function registerSite(urlBase: string) {
  const env = await worker.getEnv();
  await env.DB.prepare("INSERT INTO sites (user_id, url_base) VALUES (?, ?)")
    .bind("user_test", urlBase)
    .run();
}

describe("public pages", () => {
  test("serves robots.txt", async () => {
    const response = await server.fetch("/robots.txt");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Sitemap:/);
  });

  test("lists content pages in the sitemap", async () => {
    const response = await server.fetch("/sitemap.xml");
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("Content-Type") ?? "",
      /^application\/xml/,
    );
    const xml = await response.text();
    for (const path of ["/help", "/legal", "/help/guides/nextjs"]) {
      assert.ok(xml.includes(`${path}</loc>`), path);
    }
    assert.doesNotMatch(xml, /\/blog|#/);
  });

  test("serves llms.txt as a static file", async () => {
    const response = await server.fetch("/llms.txt");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /^# Mosaic\n/);
  });

  test("redirects old blog URLs to the help center", async () => {
    for (const [from, to] of [
      ["/blog", "/help"],
      ["/blog/hello-world", "/help/hello-world"],
    ]) {
      const response = await server.fetch(from, { redirect: "manual" });
      assert.equal(response.status, 301, from);
      assert.equal(
        new URL(response.headers.get("Location") ?? "", "http://x").pathname,
        to,
        from,
      );
    }
  });

  test("sets security headers on Worker responses", async () => {
    const response = await server.fetch("/robots.txt");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.match(
      response.headers.get("Content-Security-Policy") ?? "",
      /frame-ancestors 'none'/,
    );
  });
});

describe("signed-out page cache", () => {
  async function fetchPage(path: string, headers?: Record<string, string>) {
    return server.fetch(path, {
      headers: { Accept: "text/html", ...headers },
      redirect: "manual",
    });
  }

  test("serves repeat signed-out visits from the cache", async (t) => {
    const first = await fetchPage("/help");
    // Development Clerk keys (some cloud sessions) handshake every signed-out
    // request, so they never use the page cache. CI's placeholders do.
    if (first.headers.get("Location")?.includes("/v1/client/handshake")) {
      t.skip("Clerk development keys redirect to the handshake");
      return;
    }
    assert.equal(first.headers.get("X-Mosaic-Cache"), "MISS");
    const html = await first.text();

    let second = await fetchPage("/help");
    for (let attempt = 0; attempt < 20; attempt++) {
      if (second.headers.get("X-Mosaic-Cache") === "HIT") break;
      await second.arrayBuffer();
      await new Promise((resolve) => setTimeout(resolve, 50));
      second = await fetchPage("/help");
    }
    assert.equal(second.headers.get("X-Mosaic-Cache"), "HIT");
    assert.equal(second.headers.get("Cache-Control"), null);
    assert.match(
      second.headers.get("Content-Security-Policy") ?? "",
      /frame-ancestors 'none'/,
    );
    assert.equal(await second.text(), html);
  });

  test("renders fresh for requests that may be signed in", async () => {
    for (const cookie of ["__session=abc", "__client_uat=1760000000"]) {
      const response = await fetchPage("/help", { Cookie: cookie });
      assert.equal(response.headers.get("X-Mosaic-Cache"), null, cookie);
      await response.arrayBuffer();
    }
  });

  test("leaves Markdown requests to content negotiation", async () => {
    const response = await fetchPage("/help", { Accept: "text/markdown" });
    assert.match(response.headers.get("Content-Type") ?? "", /^text\/markdown/);
    assert.equal(response.headers.get("X-Mosaic-Cache"), null);
    await response.arrayBuffer();
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
    // Redirects stay on the serving origin (the harness, not VITE_SITE_URL)
    // so previews read images from their own bucket.
    const { url } = await server.listen();
    assert.equal(
      response.headers.get("Location"),
      new URL("/i/global/cached.jpeg", url).toString(),
    );

    // A bare hostname resolves to the same canonical page.
    const bare = await server.fetch("/use?url=example.com", {
      redirect: "manual",
    });
    assert.equal(
      bare.headers.get("Location"),
      response.headers.get("Location"),
    );
  });

  test("serves an expired image at once and refreshes it afterwards", async () => {
    await registerSite("example.com");
    await insertGlobalImage("global/stale.jpeg", Date.now() - 1);

    const response = await server.fetch("/use?url=https://example.com/", {
      redirect: "manual",
    });
    assert.equal(response.status, 307);
    assert.match(
      response.headers.get("Location") ?? "",
      /\/i\/global\/stale\.jpeg$/,
    );
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  });

  test("refuses private and self-referential targets", async () => {
    for (const target of [
      "localhost:3000",
      "http://127.0.0.1/",
      "https://user:pass@example.com/",
      "https://mosaic.account.workers.dev/use",
    ]) {
      const response = await server.fetch(
        `/use?url=${encodeURIComponent(target)}`,
      );
      assert.equal(response.status, 400, target);
    }
  });
});

describe("content negotiation", () => {
  test("serves Markdown mirrors of content pages", async () => {
    const pages = {
      "/": /^# Mosaic\n[\s\S]*\/help\/guides\//,
      "/help": /^# Help\n[\s\S]*\]\(\/help\/guides\/nextjs\)/,
      "/help/guides/nextjs": /^# Next\.js\n/,
      "/help/use-the-mosaic-api": /^# Use the Mosaic API\n/,
      "/legal": /^# Privacy Policy\n[\s\S]*\n---\n/,
    };
    for (const [path, body] of Object.entries(pages)) {
      const response = await server.fetch(path, {
        headers: { Accept: "text/markdown" },
      });
      assert.equal(response.status, 200, path);
      assert.match(
        response.headers.get("Content-Type") ?? "",
        /^text\/markdown/,
        path,
      );
      assert.match(await response.text(), body, path);
    }
  });

  test("still serves content pages as HTML to browsers", async (t) => {
    for (const path of ["/help", "/help/guides/nextjs", "/legal"]) {
      const response = await server.fetch(path, {
        headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
        redirect: "manual",
      });
      // A build with real Clerk development keys (some cloud sessions) sends
      // signed-out page requests to Clerk's handshake first. CI builds with
      // placeholder keys, so it always checks the rendered page.
      if (response.headers.get("Location")?.includes("/v1/client/handshake")) {
        t.skip("Clerk development keys redirect to the handshake");
        return;
      }
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get("Content-Type") ?? "", /^text\/html/);
      assert.match(await response.text(), /<html/, path);
    }
  });

  test("answers JSON requests for pages with problem documents", async () => {
    for (const path of ["/", "/legal", "/help/guides/nextjs"]) {
      const response = await server.fetch(path, {
        headers: { Accept: "application/json" },
      });
      assert.equal(response.status, 406, path);
    }
    for (const path of ["/nope", "/help/missing"]) {
      const response = await server.fetch(path, {
        headers: { Accept: "application/json" },
      });
      assert.equal(response.status, 404, path);
      assert.equal(
        ((await response.json()) as { code: string }).code,
        "not_found",
      );
    }
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

  test("answers HEAD with headers only", async () => {
    const env = await worker.getEnv();
    await env.OG_BUCKET.put("global/head.jpeg", new Uint8Array([1, 2, 3]));

    const response = await server.fetch("/i/global/head.jpeg", {
      method: "HEAD",
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/jpeg");
    assert.ok(response.headers.get("ETag"));
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  });

  test("caches versioned images as immutable", async () => {
    const key = `global/${pageHash}-abc123.jpeg`;
    const env = await worker.getEnv();
    await env.OG_BUCKET.put(key, new Uint8Array([4, 5, 6]), {
      httpMetadata: { contentType: "image/jpeg" },
    });

    const response = await server.fetch(`/i/${key}`);
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("Cache-Control"),
      "public, max-age=31536000, immutable",
    );
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
    await response.arrayBuffer();

    // Once cached, the image is served without reading R2.
    await env.OG_BUCKET.delete(key);
    const fetchCached = async () => {
      for (let attempt = 0; ; attempt++) {
        const cached = await server.fetch(`/i/${key}`, { redirect: "manual" });
        if (cached.status === 200 || attempt === 20) return cached;
        await cached.arrayBuffer();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    };
    const cached = await fetchCached();
    assert.equal(cached.status, 200);
    assert.deepEqual(
      new Uint8Array(await cached.arrayBuffer()),
      new Uint8Array([4, 5, 6]),
    );

    // HEAD describes the same cached image instead of redirecting.
    const head = await server.fetch(`/i/${key}`, {
      method: "HEAD",
      redirect: "manual",
    });
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  });

  test("redirects a replaced image to the page's current one", async () => {
    const currentKey = `global/${pageHash}-def456.jpeg`;
    await insertGlobalImage(currentKey, Date.now() + 60_000);
    const { url } = await server.listen();

    for (const oldKey of [
      `global/${pageHash}-abc123.jpeg`,
      `global/${pageHash}.jpeg`,
    ]) {
      const response = await server.fetch(`/i/${oldKey}`, {
        redirect: "manual",
      });
      assert.equal(response.status, 307, oldKey);
      assert.equal(
        response.headers.get("Location"),
        new URL(`/i/${currentKey}`, url).toString(),
      );
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    }

    // Another page's key doesn't resolve to this one.
    const other = await server.fetch(`/i/global/${"b".repeat(64)}-1.jpeg`);
    assert.equal(other.status, 404);
  });

  test("redirects keys from old per-site prefixes once they are replaced", async () => {
    const currentKey = `global/${pageHash}-def456.jpeg`;
    await insertGlobalImage(currentKey, Date.now() + 60_000);
    const { url } = await server.listen();

    for (const oldKey of [
      `msk7vkfb-u4ks6195/${pageHash}.jpeg`,
      `j57cqpbz24vagv88w6kq1c62zd7xvxzx/${pageHash}.png`,
    ]) {
      const response = await server.fetch(`/i/${oldKey}`, {
        redirect: "manual",
      });
      assert.equal(response.status, 307, oldKey);
      assert.equal(
        response.headers.get("Location"),
        new URL(`/i/${currentKey}`, url).toString(),
      );
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    }

    // Until a refresh deletes it, the old object is still served as is.
    const env = await worker.getEnv();
    const stored = `msk7vkfb-u4ks6195/${"b".repeat(64)}.jpeg`;
    await env.OG_BUCKET.put(stored, new Uint8Array([7]));
    const response = await server.fetch(`/i/${stored}`, { redirect: "manual" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    await response.arrayBuffer();
  });

  test("never sets cookies, even for signed-in browsers", async () => {
    await registerSite("example.com");
    const env = await worker.getEnv();
    const key = `global/${pageHash}-abc123.jpeg`;
    await env.OG_BUCKET.put(key, new Uint8Array([1]));
    const cookie = "__session=expired; __client_uat=1760000000; __refresh_x=y";

    for (const path of [`/i/${key}`, "/use?url=https://example.com/"]) {
      const response = await server.fetch(path, {
        headers: { Cookie: cookie },
        redirect: "manual",
      });
      assert.equal(response.headers.get("Set-Cookie"), null, path);
      await response.arrayBuffer();
    }
  });

  test("returns 404 for missing images", async () => {
    const response = await server.fetch("/i/global/missing.jpeg");
    assert.equal(response.status, 404);
  });
});
