/**
 * R2 keys for shared OG images. Each screenshot of a page gets a new key,
 * `global/<sha256(pageUrl)>-<version>.jpeg`, so the content at a key never
 * changes and `/i/<key>` can be cached for good. Keys from before versioning
 * were overwritten in place: `global/<sha256(pageUrl)>.jpeg`, and before that
 * `<r2Prefix>/<sha256(pageUrl)>.jpeg` (or `.png`) under a per-site prefix such
 * as `msk7vkfb-u4ks6195` or a 32-character Convex ID.
 */

const VERSIONED_KEY = /^global\/([0-9a-f]{64})-[0-9a-z]+\.jpeg$/;
const LEGACY_KEY =
  /^[0-9a-z]{1,32}(?:-[0-9a-z]{1,32})?\/([0-9a-f]{64})\.(?:jpeg|png)$/;

export function buildImageKey(pageHash: string, version: number): string {
  return `global/${pageHash}-${version.toString(36)}.jpeg`;
}

/**
 * The page hash of a shared image key, and whether the key is versioned
 * (immutable). `null` for keys Mosaic doesn't create.
 */
export function parseImageKey(
  key: string,
): { pageHash: string; immutable: boolean } | null {
  const versioned = VERSIONED_KEY.exec(key);
  if (versioned) return { pageHash: versioned[1], immutable: true };
  const legacy = LEGACY_KEY.exec(key);
  if (legacy) return { pageHash: legacy[1], immutable: false };
  return null;
}

/**
 * The inclusive key range holding every image of one page: versioned keys
 * (`<hash>-…`) sort before the legacy key (`<hash>.jpeg`) because "-" < ".".
 */
export function imageKeyRange(pageHash: string): [string, string] {
  return [`global/${pageHash}-`, `global/${pageHash}.jpeg`];
}
