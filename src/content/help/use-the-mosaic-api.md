---
title: "Use the Mosaic API"
description: "Generate OG images programmatically with the /use endpoint."
category: "Guides"
publishedAt: "2025-06-20T12:10:00.000Z"
---

Mosaic provides a simple API for on-demand OG images. Send a `GET` request to:

```txt
https://mosaic.praveenjuge.com/use?url=YOUR_URL
```

Replace `YOUR_URL` with the encoded HTTPS page URL you want to capture. Add the
page's hostname to any Mosaic account once, then use the endpoint directly—no
verification file, token, or signature is required. Images are cached globally
by canonical page URL and refreshed automatically after 30 days.

Use `mode=demo` to test a public URL without storing an image.

Example using `curl`:

```bash
curl "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fexample.com"
```

The response is a `307` redirect to the cached or newly generated OG image.
