/**
 * Stub for `@cloudflare/puppeteer` so that vitest can import og-generation.ts
 * without the Cloudflare runtime. Integration tests will mock puppeteer.launch
 * directly via vi.mock.
 */
export default {
  launch: async () => {
    throw new Error("puppeteer.launch is not available in the test environment");
  },
};
