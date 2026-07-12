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

Replace `YOUR_URL` with the page you want a screenshot of. If the site is added to your account, the API will return the image or redirect to a cached copy. Use `demo=true` to test without storing images.

Example using `curl`:

```bash
curl "https://mosaic.praveenjuge.com/use?url=https://example.com"
```

The response will be a direct link to the generated OG image.
