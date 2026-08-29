---
title: "How Mosaic Refreshes OG Images"
description: "Learn how automatic shared-cache refresh keeps screenshots current."
category: "Guides"
publishedAt: "2025-06-20T12:05:00.000Z"
---

Mosaic refreshes shared OG images automatically. There is no verification,
signature, or manual purge workflow.

1. The first request for a page creates a shared cached screenshot.
2. Requests reuse that image for up to 30 days.
3. After expiry, the next eligible request creates a fresh screenshot.
4. During heavy traffic, Mosaic can keep serving the previous image until
   generation capacity is available.

Social platforms may also cache previews independently. Their own card debugger
or re-scrape tool can be used when you need that platform to fetch the current
Mosaic image again.
