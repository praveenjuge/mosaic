/**
 * Stub for `cloudflare:workers` so that vitest can import og-generation.ts
 * without the Cloudflare runtime. The `env` object is intentionally empty —
 * tests that exercise handleUseRequest will provide their own mocks.
 */
export const env: Record<string, unknown> = {};
