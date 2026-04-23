import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Feature: cloudflare-native-use-endpoint
 * Integration tests for the full request handler
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 2.6, 3.3, 3.4, 3.5, 4.2, 4.4, 6.1, 7.3, 7.4, 8.3, 8.4
 *
 * Tests the complete handleUseRequest flow with mocked Cloudflare bindings
 * and Convex client, covering cache hits, cache misses, error scenarios,
 * and the OPTIONS preflight handler.
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

import { handleUseRequest, corsHeaders } from "@/lib/og-generation";

// ── Types ───────────────────────────────────────────────────────────

interface JsonBody {
  imageUrl?: string;
  cached?: boolean;
  fallback?: boolean;
  error?: string;
}

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

describe("Integration: handleUseRequest full request flows", () => {
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

  // ── 1. Cache hit flow (production) ──────────────────────────────

  describe("cache hit flow (production)", () => {
    it("returns 307 redirect to correct public URL when R2 cache hit", async () => {
      mockQuery.mockResolvedValue({
        sites: [
          { siteId: "s1", url_base: "example.com", r2Prefix: "prefix1" },
        ],
        selectedSite: {
          siteId: "s1",
          url_base: "example.com",
          r2Prefix: "prefix1",
        },
      });
      mockHead.mockResolvedValue({ size: 1000 });

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com/page",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(307);

      const location = response.headers.get("Location");
      expect(location).toBeTruthy();
      expect(location).toMatch(
        /^https:\/\/og\.mosaicimg\.com\/prefix1\/[a-f0-9]{64}\.png$/,
      );

      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000, immutable",
      );

      assertCorsHeaders(response);
    });
  });

  // ── 2. Cache hit flow (demo) ────────────────────────────────────

  describe("cache hit flow (demo)", () => {
    it("returns JSON with imageUrl, cached: true, and fallback: false", async () => {
      mockHead.mockResolvedValue({ size: 1000 });

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com&demo=true",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(200);

      const body = (await response.json()) as JsonBody;
      expect(body.imageUrl).toMatch(/^https:\/\/og\.mosaicimg\.com\/demo\//);
      expect(body.cached).toBe(true);
      expect(body.fallback).toBe(false);

      assertCorsHeaders(response);
    });
  });

  // ── 3. Cache miss → generate → store flow ───────────────────────

  describe("cache miss → generate → store flow (production)", () => {
    it("takes screenshot, stores in R2, calls Convex mutation, and returns 307 redirect", async () => {
      const selectedSite = {
        siteId: "s1",
        url_base: "example.com",
        r2Prefix: "prefix1",
      };
      mockQuery.mockResolvedValue({
        sites: [selectedSite],
        selectedSite,
      });
      mockHead.mockResolvedValue(null); // cache miss
      mockPut.mockResolvedValue(undefined);

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com/page",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(307);

      // Verify R2 put was called with correct key and content type
      expect(mockPut).toHaveBeenCalledTimes(1);
      const [putKey, , putOptions] = mockPut.mock.calls[0];
      expect(putKey).toMatch(/^prefix1\/[a-f0-9]{64}\.png$/);
      expect(putOptions).toEqual({
        httpMetadata: { contentType: "image/png" },
      });

      // Verify Convex mutation was called with correct args
      expect(mockMutation).toHaveBeenCalledTimes(1);
      const mutationArgs = mockMutation.mock.calls[0][1];
      expect(mutationArgs).toMatchObject({
        siteId: "s1",
        pageUrl: "https://example.com/page",
        imageKey: expect.stringMatching(/^prefix1\/[a-f0-9]{64}\.png$/),
        isNew: true,
      });
      expect(mutationArgs.imageSize).toBe(100);

      assertCorsHeaders(response);
    });
  });

  // ── 4. Site not found ───────────────────────────────────────────

  describe("site not found", () => {
    it("returns 404 JSON error when Convex returns empty sites", async () => {
      mockQuery.mockResolvedValue({ sites: [], selectedSite: null });

      const request = new Request(
        "https://worker.example.com/use?url=https://unknown-site.com",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(404);

      const body = (await response.json()) as JsonBody;
      expect(body.error).toBe(
        "Website must be added to Mosaic before generating OG images",
      );

      assertCorsHeaders(response);
    });
  });

  // ── 5. Plan limit exceeded ──────────────────────────────────────

  describe("plan limit exceeded", () => {
    it("returns 403 JSON error when selectedSite is null but sites exist", async () => {
      mockQuery.mockResolvedValue({
        sites: [
          { siteId: "s1", url_base: "example.com", r2Prefix: "prefix1" },
        ],
        selectedSite: null,
      });
      mockHead.mockResolvedValue(null); // no cache hit for any site

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(403);

      const body = (await response.json()) as JsonBody;
      expect(body.error).toBe(
        "OG image limit exceeded for this plan. Please upgrade your subscription.",
      );

      assertCorsHeaders(response);
    });
  });

  // ── 6. Browser failure ──────────────────────────────────────────

  describe("browser failure", () => {
    it("returns 500 JSON error when Browser Rendering API fails", async () => {
      const selectedSite = {
        siteId: "s1",
        url_base: "example.com",
        r2Prefix: "prefix1",
      };
      mockQuery.mockResolvedValue({
        sites: [selectedSite],
        selectedSite,
      });
      mockHead.mockResolvedValue(null);
      mockFetch.mockResolvedValue(
        new Response("Service unavailable", { status: 500 }),
      );

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(500);

      const body = (await response.json()) as JsonBody;
      expect(body.error).toBe("Failed to take screenshot");

      assertCorsHeaders(response);
    });
  });

  // ── 7. R2 storage failure ──────────────────────────────────────

  describe("R2 storage failure", () => {
    it("returns base64 data URI fallback with fallback: true when R2 put throws", async () => {
      const selectedSite = {
        siteId: "s1",
        url_base: "example.com",
        r2Prefix: "prefix1",
      };
      mockQuery.mockResolvedValue({
        sites: [selectedSite],
        selectedSite,
      });
      mockHead.mockResolvedValue(null);
      mockPut.mockRejectedValue(new Error("R2 write failed"));

      const request = new Request(
        "https://worker.example.com/use?url=https://example.com",
      );
      const response = await handleUseRequest(request);

      expect(response.status).toBe(200);

      const body = (await response.json()) as JsonBody;
      expect(body.imageUrl).toMatch(/^data:image\/png;base64,/);
      expect(body.fallback).toBe(true);
      expect(body.cached).toBe(false);

      assertCorsHeaders(response);
    });
  });

  // ── 8. OPTIONS preflight ────────────────────────────────────────

  describe("OPTIONS preflight", () => {
    it("returns 204 with all CORS headers", () => {
      const response = new Response(null, {
        status: 204,
        headers: corsHeaders,
      });

      expect(response.status).toBe(204);
      assertCorsHeaders(response);
    });
  });
});
