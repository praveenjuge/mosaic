import { describe, expect, test } from "bun:test";
import {
  signGenerationUrl,
  verifyGenerationSignature,
} from "./generation-signature";

const secret = "ab".repeat(32);
const url = "https://example.com/article?a=1";

describe("generation signatures", () => {
  test("accepts the exact signed canonical URL", async () => {
    const signature = await signGenerationUrl(secret, url);
    expect(await verifyGenerationSignature(secret, url, signature)).toBe(true);
  });

  test("rejects URL and signature tampering", async () => {
    const signature = await signGenerationUrl(secret, url);
    expect(
      await verifyGenerationSignature(secret, `${url}&a=2`, signature),
    ).toBe(false);
    expect(await verifyGenerationSignature(secret, url, "00".repeat(32))).toBe(
      false,
    );
  });

  test("uses the same canonical identity as OG storage", async () => {
    const signature = await signGenerationUrl(secret, "https://example.com/#top");
    expect(
      await verifyGenerationSignature(secret, "https://example.com", signature),
    ).toBe(true);
  });
});
