function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
}

function bytesToHex(value: ArrayBuffer): string {
  return Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function importHmacKey(secret: string): Promise<CryptoKey | null> {
  const bytes = hexToBytes(secret);
  if (!bytes) return null;
  return crypto.subtle.importKey(
    "raw",
    bytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign one canonical page URL. Keep the site secret on a server/build system. */
export function canonicalizeGenerationUrl(pageUrl: string): string {
  return extractUrlParts(pageUrl).sanitizedUrl;
}

export async function signGenerationUrl(
  secret: string,
  pageUrl: string,
): Promise<string> {
  const key = await importHmacKey(secret);
  if (!key) throw new Error("Invalid generation secret.");
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(canonicalizeGenerationUrl(pageUrl)),
  );
  return bytesToHex(signature);
}

export async function verifyGenerationSignature(
  secret: string,
  pageUrl: string,
  signature: string,
): Promise<boolean> {
  const [key, signatureBytes] = await Promise.all([
    importHmacKey(secret),
    Promise.resolve(hexToBytes(signature)),
  ]);
  if (!key || !signatureBytes) return false;
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as BufferSource,
    new TextEncoder().encode(canonicalizeGenerationUrl(pageUrl)),
  );
}
import { extractUrlParts } from "./url";
