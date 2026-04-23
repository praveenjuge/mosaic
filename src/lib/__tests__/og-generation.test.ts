import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  generateCacheKey,
  getR2Key,
  buildPublicImageUrl,
  validateUrl,
  createJsonResponse,
  createRedirectResponse,
  corsHeaders,
} from "@/lib/og-generation";

/**
 * Feature: cloudflare-native-use-endpoint
 * Property 1: Cache key is deterministic SHA-256 digest
 *
 * Validates: Requirements 1.1
 */
describe("Feature: cloudflare-native-use-endpoint, Property 1: Cache key is deterministic SHA-256 digest", () => {
  it("generateCacheKey(url) returns the lowercase hex SHA-256 digest and is idempotent", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (url) => {
        // Compute expected SHA-256 independently using Web Crypto API
        const data = new TextEncoder().encode(url);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const expectedHex = Array.from(new Uint8Array(hashBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");

        // Call the function under test
        const result = await generateCacheKey(url);

        // Verify it matches the independent computation
        expect(result).toBe(expectedHex);

        // Verify idempotency: calling twice yields the same result
        const result2 = await generateCacheKey(url);
        expect(result).toBe(result2);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: cloudflare-native-use-endpoint
 * Property 2: R2 key format preserves prefix and cache key
 *
 * Validates: Requirements 3.2, 8.1
 */
describe("Feature: cloudflare-native-use-endpoint, Property 2: R2 key format preserves prefix and cache key", () => {
  it("getR2Key(cacheKey, prefix, false) returns '{prefix}/{cacheKey}.png'", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (prefix, cacheKey) => {
        const result = getR2Key(cacheKey, prefix, false);
        expect(result).toBe(`${prefix}/${cacheKey}.png`);
      }),
      { numRuns: 100 },
    );
  });

  it("getR2Key(cacheKey, undefined, true) returns 'demo/{cacheKey}.png'", () => {
    fc.assert(
      fc.property(fc.string(), (cacheKey) => {
        const result = getR2Key(cacheKey, undefined, true);
        expect(result).toBe(`demo/${cacheKey}.png`);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: cloudflare-native-use-endpoint
 * Property 3: Public image URL construction
 *
 * Validates: Requirements 1.3, 8.2
 */
describe("Feature: cloudflare-native-use-endpoint, Property 3: Public image URL construction", () => {
  it("buildPublicImageUrl(key) returns 'https://og.mosaicimg.com/{key}' for any key string", () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        const result = buildPublicImageUrl(key);
        expect(result).toBe(`https://og.mosaicimg.com/${key}`);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: cloudflare-native-use-endpoint
 * Property 4: URL validation rejects non-HTTP(S) and malformed URLs
 *
 * Validates: Requirements 6.2
 */
describe("Feature: cloudflare-native-use-endpoint, Property 4: URL validation rejects non-HTTP(S) and malformed URLs", () => {
  it("valid HTTP/HTTPS URLs are accepted", () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const result = validateUrl(url, false);
        expect(result.isValid).toBe(true);
        expect(result.validatedUrl).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("non-HTTP protocols are rejected", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("ftp", "file", "data", "ssh", "telnet"),
        fc.webUrl(),
        (protocol, webUrl) => {
          // Replace the protocol of the generated web URL
          const url = webUrl.replace(/^https?/, protocol);
          const result = validateUrl(url, false);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe("Invalid URL provided");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("malformed strings are rejected", () => {
    fc.assert(
      fc.property(
        fc
          .string()
          .filter((s) => !s.startsWith("http://") && !s.startsWith("https://")),
        (str) => {
          const result = validateUrl(str, false);
          expect(result.isValid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("localhost URLs are rejected in production", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "http://localhost",
          "http://127.0.0.1",
          "http://0.0.0.0",
          "http://localhost/path/to/page",
          "http://127.0.0.1/some/path",
          "http://0.0.0.0/another/path",
          "https://localhost",
          "https://127.0.0.1",
          "https://0.0.0.0",
        ),
        (url) => {
          const result = validateUrl(url, true);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe("Local URLs are not allowed");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("localhost URLs are allowed in non-production", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "http://localhost",
          "http://127.0.0.1",
          "http://0.0.0.0",
          "http://localhost/path/to/page",
          "http://127.0.0.1/some/path",
          "http://0.0.0.0/another/path",
          "https://localhost",
          "https://127.0.0.1",
          "https://0.0.0.0",
        ),
        (url) => {
          const result = validateUrl(url, false);
          expect(result.isValid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Unit tests for CORS headers and response helpers
 *
 * Validates: Requirements 7.3, 8.3, 8.4
 */
describe("CORS headers and response helpers", () => {
  it("corsHeaders constant has all required headers with correct values", () => {
    expect(corsHeaders).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    expect(Object.keys(corsHeaders)).toHaveLength(3);
  });

  it("createJsonResponse attaches CORS headers and Content-Type", async () => {
    const response = createJsonResponse({ error: "test" }, 400);

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Authorization",
    );

    const body = await response.json();
    expect(body).toEqual({ error: "test" });
  });

  it.each([400, 403, 404, 500])(
    "createJsonResponse works for status %i with CORS headers",
    (status) => {
      const response = createJsonResponse(
        { error: `error for ${status}` },
        status,
      );

      expect(response.status).toBe(status);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type, Authorization",
      );
    },
  );

  it("createRedirectResponse returns 307 with correct headers", () => {
    const location = "https://og.mosaicimg.com/test/key.png";
    const response = createRedirectResponse(location);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(location);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Authorization",
    );
    expect(response.body).toBeNull();
  });
});
