import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { readImageSize } from "./image-size";

const publicFile = (name: string) =>
  readFile(path.resolve(import.meta.dir, "../../public", name));

describe("readImageSize", () => {
  test("reads PNG, JPEG, and lossy WebP sizes", async () => {
    expect(
      readImageSize(await publicFile("images/mosaic-example-og-f9e253a9.png")),
    ).toEqual({ width: 1200, height: 630 });
    expect(
      readImageSize(
        await publicFile("images/original-example-og-814873d7.jpg"),
      ),
    ).toEqual({ width: 2400, height: 1350 });
    expect(
      readImageSize(
        await publicFile("images/mosaic-example-og-864w-a55bc7b7.webp"),
      ),
    ).toEqual({ width: 864, height: 454 });
  });

  test("reads lossless and extended WebP headers", () => {
    // VP8L: 14-bit width-1 and height-1 packed after the 0x2f signature.
    const vp8l = new Uint8Array(30);
    vp8l.set(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8L"));
    new DataView(vp8l.buffer).setUint32(21, 99 | (49 << 14), true);
    expect(readImageSize(vp8l)).toEqual({ width: 100, height: 50 });

    // VP8X: 24-bit width-1 and height-1 at offsets 24 and 27.
    const vp8x = new Uint8Array(30);
    vp8x.set(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8X"));
    vp8x.set([0xff, 0x01, 0x00, 0x2b, 0x01, 0x00], 24);
    expect(readImageSize(vp8x)).toEqual({ width: 512, height: 300 });
  });

  test("returns null for other files", () => {
    expect(readImageSize(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(readImageSize(new Uint8Array())).toBeNull();
  });
});
