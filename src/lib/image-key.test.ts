import { describe, expect, test } from "bun:test";
import { buildImageKey, imageKeyRange, parseImageKey } from "./image-key";

const hash = "a".repeat(64);

describe("image keys", () => {
  test("versioned keys round-trip and are immutable", () => {
    const key = buildImageKey(hash, 1_760_000_000_000);
    expect(key).toMatch(/^global\/a{64}-[0-9a-z]+\.jpeg$/);
    expect(parseImageKey(key)).toEqual({ pageHash: hash, immutable: true });
  });

  test("legacy keys parse as mutable", () => {
    expect(parseImageKey(`global/${hash}.jpeg`)).toEqual({
      pageHash: hash,
      immutable: false,
    });
  });

  test("rejects keys Mosaic does not create", () => {
    for (const key of [
      "global/test.jpeg",
      `global/${hash}-.jpeg`,
      `global/${hash}-ABC.jpeg`,
      `other/${hash}.jpeg`,
      `global/${hash}.jpeg/extra`,
    ]) {
      expect(parseImageKey(key)).toBeNull();
    }
  });

  test("the key range covers versioned and legacy keys of one page only", () => {
    const [low, high] = imageKeyRange(hash);
    const inRange = (key: string) => key >= low && key <= high;
    expect(inRange(buildImageKey(hash, 0))).toBe(true);
    expect(inRange(buildImageKey(hash, Number.MAX_SAFE_INTEGER))).toBe(true);
    expect(inRange(`global/${hash}.jpeg`)).toBe(true);
    expect(inRange(buildImageKey("b".repeat(64), 1))).toBe(false);
    expect(inRange(`global/${"a".repeat(63)}b.jpeg`)).toBe(false);
  });
});
