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
// The Analytics SQL binding only exists remotely, and only the signed-in
// dashboard reads it, so the harness goes without it.
const builtConfig = JSON.parse(
  readFileSync("./dist/server/wrangler.json", "utf8"),
);
delete builtConfig.browser?.remote;
delete builtConfig.analytics;
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
  await worker.applyD1Migrations("DB");
});

// Restarting workerd for every test (`server.reset()`) costs about a second
// each, so tests share one Worker instead: D1 tables and the R2 bucket are
// emptied before each test, but the Cache API is not. A test that caches a
// response (an `/i` image, signed-out HTML) must use a key or path that no
// other test requests; `/use` answers are cached per hostname, so each `/use`
// test uses its own (see `testHost`). Rate limiter counts also carry over
// between tests. Work a test starts with `waitUntil` (a stale image's
// refresh) can still write to D1 after the next test begins, so a test that
// depends on generation rows should not rely on a stale refresh before it.
beforeEach(async () => {
  const env = await worker.getEnv();
  const { results } = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'",
  ).all<{ name: string }>();
  await env.DB.batch(
    results.map(({ name }) => env.DB.prepare(`DELETE FROM "${name}"`)),
  );
  for (;;) {
    const { objects } = await env.OG_BUCKET.list();
    if (objects.length === 0) break;
    await env.OG_BUCKET.delete(objects.map(({ key }) => key));
  }
});

after(async () => {
  await server.close();
});

async function insertGlobalImage(
  key: string,
  expiresAt: number,
  hostname = "example.com",
) {
  const env = await worker.getEnv();
  await env.DB.prepare(
    "INSERT INTO global_images (page_url, hostname, key, size_in_bytes, generated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(`https://${hostname}`, hostname, key, 3, Date.now(), expiresAt)
    .run();
}

const pageHash = "a".repeat(64);

// A hostname no other test uses, for tests whose `/use` answers get cached.
let testHosts = 0;
function testHost() {
  return `site-${++testHosts}.example.com`;
}

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
    // No other test requests this page as HTML, so the first visit misses.
    const path = "/help/hello-world";
    const first = await fetchPage(path);
    // Development Clerk keys (some cloud sessions) handshake every signed-out
    // request, so they never use the page cache. CI's placeholders do.
    if (first.headers.get("Location")?.includes("/v1/client/handshake")) {
      t.skip("Clerk development keys redirect to the handshake");
      return;
    }
    assert.equal(first.headers.get("X-Mosaic-Cache"), "MISS");
    const html = await first.text();

    let second = await fetchPage(path);
    for (let attempt = 0; attempt < 20; attempt++) {
      if (second.headers.get("X-Mosaic-Cache") === "HIT") break;
      await second.arrayBuffer();
      await new Promise((resolve) => setTimeout(resolve, 50));
      second = await fetchPage(path);
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
    const response = await server.fetch(`/use?url=https://${testHost()}/`);
    assert.equal(response.status, 404);
  });

  test("falls back to the example image when Browser Run fails", async () => {
    const host = testHost();
    await registerSite(host);

    const response = await server.fetch(`/use?url=https://${host}/`, {
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
    const host = testHost();
    await registerSite(host);
    await insertGlobalImage("global/cached.jpeg", Date.now() + 60_000, host);

    const response = await server.fetch(`/use?url=https://${host}/`, {
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
    const bare = await server.fetch(`/use?url=${host}`, {
      redirect: "manual",
    });
    assert.equal(
      bare.headers.get("Location"),
      response.headers.get("Location"),
    );
  });

  test("serves an expired image at once and refreshes it afterwards", async () => {
    const host = testHost();
    await registerSite(host);
    await insertGlobalImage("global/stale.jpeg", Date.now() - 1, host);

    const response = await server.fetch(`/use?url=https://${host}/`, {
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
    // Its own page hash: the cached response outlives this test.
    const key = `global/${"c".repeat(64)}-abc123.jpeg`;
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
    const host = testHost();
    await registerSite(host);
    const env = await worker.getEnv();
    const key = `global/${"d".repeat(64)}-abc123.jpeg`;
    await env.OG_BUCKET.put(key, new Uint8Array([1]));
    const cookie = "__session=expired; __client_uat=1760000000; __refresh_x=y";

    for (const path of [`/i/${key}`, `/use?url=https://${host}/`]) {
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

describe("/use answers and guards", () => {
  const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

  async function budgetCount(scope: string): Promise<number | null> {
    const env = await worker.getEnv();
    const row = await env.DB.prepare(
      "SELECT count FROM generation_budgets WHERE scope = ?",
    )
      .bind(scope)
      .first<{ count: number }>();
    return row?.count ?? null;
  }

  async function setBudget(scope: string, key: string, count: number) {
    const env = await worker.getEnv();
    const now = new Date();
    const dayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    await env.DB.prepare(
      "INSERT INTO generation_budgets (scope, budget_key, window_start, count) VALUES (?, ?, ?, ?)",
    )
      .bind(scope, key, dayStart, count)
      .run();
  }

  test("answers repeat requests for a fresh image from the colo cache", async () => {
    const host = testHost();
    await registerSite(host);
    await insertGlobalImage(
      "global/remembered.jpeg",
      Date.now() + 60_000,
      host,
    );

    const first = await server.fetch(`/use?url=https://${host}/`, {
      redirect: "manual",
    });
    assert.equal(first.status, 307);
    await sleep(300);

    // With the D1 row gone, only the cached answer can name the image.
    const env = await worker.getEnv();
    await env.DB.prepare("DELETE FROM global_images").run();
    const repeat = await server.fetch(`/use?url=https://${host}/`, {
      redirect: "manual",
    });
    assert.equal(repeat.status, 307);
    assert.equal(repeat.headers.get("Location"), first.headers.get("Location"));
    // Browsers and crawlers still never cache the redirect itself.
    assert.equal(repeat.headers.get("Cache-Control"), "private, no-store");
  });

  test("remembers unregistered hostnames briefly", async () => {
    const host = testHost();
    const first = await server.fetch(`/use?url=https://${host}/`);
    assert.equal(first.status, 404);
    await sleep(300);

    await registerSite(host);
    const repeat = await server.fetch(`/use?url=https://${host}/a`);
    assert.equal(repeat.status, 404);
  });

  test("waits for a first image another request is generating", async () => {
    const host = testHost();
    await registerSite(host);
    const env = await worker.getEnv();
    await env.DB.prepare(
      "INSERT INTO generation_locks (page_url, lease_token, expires_at) VALUES (?, ?, ?)",
    )
      .bind(`https://${host}`, "other-request", Date.now() + 60_000)
      .run();

    const response = server.fetch(`/use?url=https://${host}/`, {
      redirect: "manual",
    });
    await sleep(1_500);
    await insertGlobalImage("global/just-made.jpeg", Date.now() + 60_000, host);

    const result = await response;
    assert.equal(result.status, 307);
    assert.match(
      result.headers.get("Location") ?? "",
      /\/i\/global\/just-made\.jpeg$/,
    );
  });

  test("answers HEAD like GET and refuses other methods", async () => {
    const head = await server.fetch("/use", { method: "HEAD" });
    assert.equal(head.status, 400);
    assert.equal(await head.text(), "");

    const post = await server.fetch(`/use?url=https://${testHost()}/`, {
      method: "POST",
    });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("Access-Control-Allow-Origin"), "*");
    await post.arrayBuffer();
  });

  test("refunds the client's demo budget when the service's is spent", async () => {
    await setBudget("demo-global", "service", 100);

    const response = await server.fetch(
      `/use?url=https://${testHost()}/&mode=demo`,
    );
    const body = (await response.json()) as { notice?: string };
    assert.match(body.notice ?? "", /capacity is currently busy/);
    assert.equal(await budgetCount("demo-client"), 0);
    assert.equal(await budgetCount("demo-global"), 100);

    // With both budgets open, both are reserved.
    const env = await worker.getEnv();
    await env.DB.prepare("DELETE FROM generation_budgets").run();
    await server
      .fetch(`/use?url=https://${testHost()}/&mode=demo`, {
        headers: { "CF-Connecting-IP": "203.0.113.10" },
      })
      .then((r) => r.arrayBuffer());
    assert.equal(await budgetCount("demo-client"), 1);
    assert.equal(await budgetCount("demo-global"), 1);
  });

  test("leaves the service's demo budget alone when the client's is spent", async () => {
    await setBudget("demo-client", "203.0.113.9", 10);

    const response = await server.fetch(
      `/use?url=https://${testHost()}/&mode=demo`,
      { headers: { "CF-Connecting-IP": "203.0.113.9" } },
    );
    const body = (await response.json()) as { notice?: string };
    assert.match(body.notice ?? "", /capacity is currently busy/);
    assert.equal(await budgetCount("demo-client"), 10);
    assert.equal(await budgetCount("demo-global"), null);
  });
});
