---
title: "Use the Mosaic API"
description: "Get an OG image for any page with one GET request to /use."
category: "Guides"
publishedAt: "2025-06-20T12:10:00.000Z"
---

Send a `GET` request with the encoded page URL:

```bash
curl -i "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fexample.com"
```

The hostname must be saved in a Mosaic account. No API key is needed.

## Responses

- **`307`** to the image at `/i/global/<hash>.jpeg`. The first request takes
  the screenshot. Later ones reuse it for 30 days.
- **`307`** to an older or fallback image if a limit is reached or the
  screenshot fails.
- **`400`** if `url` is missing or not a public HTTP(S) address.
- **`404`** if no account has saved the hostname.
- **`503`** if the page is being captured right now and has no older image.
  Retry in a few seconds.

Errors are JSON with an `error` message.
