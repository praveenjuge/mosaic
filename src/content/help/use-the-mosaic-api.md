---
title: "Use the Mosaic API"
description: "Generate OG images programmatically with the /use endpoint."
category: "Guides"
publishedAt: "2025-06-20T12:10:00.000Z"
---

Mosaic provides a simple API for on-demand OG images. Send a `GET` request to:

```txt
https://mosaic.praveenjuge.com/use?url=YOUR_URL&sig=HMAC_SIGNATURE
```

Replace `YOUR_URL` with the page you want a screenshot of. The hostname must be
verified in your account before the production API accepts it. The API redirects
to a stored image when one exists. Use `mode=demo` to test without storing an
image.

`HMAC_SIGNATURE` is the lowercase hex HMAC-SHA256 signature of the exact,
normalized page URL, using the generation secret shown after verification.
Generate it only on your server or during your site build. Never expose the
secret in browser JavaScript. A different path or query needs a new signature.

```ts
const secretBytes = Uint8Array.from(
  generationSecret.match(/.{2}/g) ?? [],
  (byte) => Number.parseInt(byte, 16),
);
const normalized = new URL(pageUrl);
normalized.hash = "";
const canonicalUrl = normalized.toString().replace(/\/+$/, "");
const key = await crypto.subtle.importKey(
  "raw",
  secretBytes,
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const signed = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(canonicalUrl),
);
const signature = Array.from(new Uint8Array(signed), (byte) =>
  byte.toString(16).padStart(2, "0"),
).join("");
```

Example using `curl`:

```bash
curl "https://mosaic.praveenjuge.com/use?url=https://example.com&sig=HMAC_SIGNATURE"
```

The response is a `307` redirect to the generated OG image.
