import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

// The Geist files in src/styles/fonts/ hold only the characters and weights
// Mosaic draws. When these fail, rerun `uv run scripts/subset-fonts.py` and
// commit what it writes.

const root = path.resolve(import.meta.dir, "../..");
const fontsDir = path.join(root, "src/styles/fonts");
const manifest = JSON.parse(
  readFileSync(path.join(fontsDir, "geist.json"), "utf8"),
) as { axis: [number, number]; scanned: string[]; systemFonts: string };

function unicodeRanges(css: string): Set<number> {
  const chars = new Set<number>();
  for (const [, ranges] of css.matchAll(/unicode-range:([^;]+);/g)) {
    for (const range of ranges.split(",")) {
      const [lo, hi = lo] = range.trim().replace("U+", "").split("-");
      for (let c = parseInt(lo, 16); c <= parseInt(hi, 16); c++) chars.add(c);
    }
  }
  return chars;
}

function scannedFiles(): string[] {
  const files = new Set<string>();
  for (const pattern of manifest.scanned) {
    for (const file of new Bun.Glob(pattern).scanSync({ cwd: root })) {
      if (!file.includes(".test.")) files.add(file);
    }
  }
  return [...files].sort();
}

describe("Geist subset", () => {
  test("has every character the pages and Clerk's strings use", () => {
    const covered = unicodeRanges(
      readFileSync(path.join(fontsDir, "geist.css"), "utf8"),
    );
    for (const c of manifest.systemFonts) covered.add(c.codePointAt(0)!);
    const missing = new Map<string, string>();
    for (const file of scannedFiles()) {
      for (const c of readFileSync(path.join(root, file), "utf8")) {
        const code = c.codePointAt(0)!;
        if (code > 0x7e && !covered.has(code) && !missing.has(c)) {
          missing.set(
            c,
            `U+${code.toString(16).toUpperCase().padStart(4, "0")} in ${file}`,
          );
        }
      }
    }
    expect([...missing.values()]).toEqual([]);
  });

  // A weight below the axis fails until AXIS in the script is widened.
  test("covers every weight the styles ask for", () => {
    const [min] = manifest.axis;
    const named: Record<string, number> = {
      thin: 100,
      extralight: 200,
      light: 300,
    };
    // Tailwind's light weights, and literal ones in CSS or inline styles.
    const weights =
      /\bfont-(thin|extralight|light)\b|font-weight:\s*(\d00)\b|fontWeight:\s*["']?(\d00)\b/g;
    const offenders: string[] = [];
    for (const file of scannedFiles()) {
      if (file.startsWith("node_modules/")) continue;
      const text = readFileSync(path.join(root, file), "utf8");
      for (const [match, name, css, inline] of text.matchAll(weights)) {
        const weight = name ? named[name] : Number(css ?? inline);
        if (weight < min) offenders.push(`${match} in ${file}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
