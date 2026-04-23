import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Feature: cloudflare-native-use-endpoint
 * Property 5: All responses include CORS headers
 *
 * Validates: Requirements 7.3
 *
 * Generate various request scenarios (missing URL, invalid URL, demo mode,
 * production mode) with mocked Cloudflare bindings and Convex client, verify
 * every response includes all three CORS headers.
 */

// ── Hoisted mock fns (available before vi.mock factories run) ───────

const {
  mockHead,
  mockPut,
  mockFetch,
  mockQuery,
  mockMutation,
} = vi.hoisted(() => {
  const mockHead = vi.fn();
  const mockPut = vi.fn();
  const mockFetch = vi.fn();
  const mockQuery = vi.fn();
  const mockMutation = vi.fn();
  return {
    mockHead,
    mockPut,
    mockFetch,
    mockQuery,
    mockMutation,
  };
});

// ── Mock cloudflare:workers env ─────────────────────────────────────

vi.mock("cloudflare:workers", () => ({
  env: {
    OG_BUCKET: {
      head: mockHead,
      put: mockPut,
    },
    CF_ACCOUNT_ID: "test-account-id",
    CF_BROWSER_RENDERING_TOKEN: "test-api-token",
  },
}));

// ── Mock global fetch for Browser Rendering REST API ────────────────

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = mockFetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ── Mock Convex client ──────────────────────────────────────────────

vi.mock("convex/browser", () => ({
  ConvexHttpClient: function () {
    return { query: mockQuery, mutation: mockMutation };
  },
}));

// Provide a VITE_CONVEX_URL so getConvexClient() doesn't throw
process.env.VITE_CONVEX_URL = "https://test.convex.cloud";

// ── Import the handler under test (after mocks are hoisted) ─────────

import { handleUseRequest } from "@/lib/og-generation";

// ── Helpers ─────────────────────────────────────────────────────────

function assertCorsHeaders(response: Response) {
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
    "GET, POST, OPTIONS",
  );
  expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
    "Content-Type, Authorization",
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Feature: cloudflare-native-use-endpoint, Property 5: All responses include CORS headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHead.mockResolvedValue(null);
    mockPut.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ sites: [], selectedSite: null });
    mockMutation.mockResolvedValue({ status: "success" });
    // Default: Browser Rendering REST API returns a 100-byte PNG
    mockFetch.mockResolvedValue(
      new Response(new ArrayBuffer(100), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      }),
    );
  });

  it("missing URL parameter → 400 with CORS headers", async () => {
    const request = new Request("https://example.com/use");
    const response = await handleUseRequest(request);
    expect(response.status).toBe(400);
    assertCorsHeaders(response);
  });

  it("invalid URL → 400 with CORS headers", async () => {
    const request = new Request("https://example.com/use?url=not-a-url");
    const response = await handleUseRequest(request);
    expect(response.status).toBe(400);
    assertCorsHeaders(response);
  });

  it("no matching sites → 404 with CORS headers", async () => {
    mockQuery.mockResolvedValue({ sites: [], selectedSite: null });
    const request = new Request(
      "https://example.com/use?url=https://test.com",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(404);
    assertCorsHeaders(response);
  });

  it("plan limit exceeded → 403 with CORS headers", async () => {
    mockQuery.mockResolvedValue({
      sites: [{ siteId: "s1", url_base: "test.com", r2Prefix: "prefix1" }],
      selectedSite: null,
    });
    mockHead.mockResolvedValue(null);
    const request = new Request(
      "https://example.com/use?url=https://test.com",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(403);
    assertCorsHeaders(response);
  });

  it("production cache hit → 307 redirect with CORS headers", async () => {
    mockQuery.mockResolvedValue({
      sites: [{ siteId: "s1", url_base: "test.com", r2Prefix: "prefix1" }],
      selectedSite: {
        siteId: "s1",
        url_base: "test.com",
        r2Prefix: "prefix1",
      },
    });
    mockHead.mockResolvedValue({ size: 1000 }); // cache hit
    const request = new Request(
      "https://example.com/use?url=https://test.com",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(307);
    assertCorsHeaders(response);
  });

  it("demo cache hit → 200 JSON with CORS headers", async () => {
    mockHead.mockResolvedValue({ size: 1000 }); // cache hit
    const request = new Request(
      "https://example.com/use?url=https://test.com&demo=true",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(200);
    assertCorsHeaders(response);
  });

  it("demo cache miss → screenshot → 200 JSON with CORS headers", async () => {
    mockHead.mockResolvedValue(null); // cache miss
    const request = new Request(
      "https://example.com/use?url=https://test.com&demo=true",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(200);
    assertCorsHeaders(response);
  });

  it("production cache miss → screenshot → 307 redirect with CORS headers", async () => {
    mockQuery.mockResolvedValue({
      sites: [{ siteId: "s1", url_base: "test.com", r2Prefix: "prefix1" }],
      selectedSite: {
        siteId: "s1",
        url_base: "test.com",
        r2Prefix: "prefix1",
      },
    });
    mockHead.mockResolvedValue(null); // cache miss
    const request = new Request(
      "https://example.com/use?url=https://test.com",
    );
    const response = await handleUseRequest(request);
    expect(response.status).toBe(307);
    assertCorsHeaders(response);
  });
});
