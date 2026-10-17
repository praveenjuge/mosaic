---
title: "How Mosaic Refreshes OG Images"
description: "Mosaic retakes each page's screenshot automatically after 30 days."
category: "Guides"
publishedAt: "2025-06-20T12:05:00.000Z"
---

Mosaic refreshes images on its own. There's no refresh button.

1. The first request for a page URL takes a screenshot and caches it.
2. For the next 30 days, every request gets that cached image.
3. After 30 days, the next request takes a new screenshot.
4. If a daily limit is reached or the capture fails, it keeps serving the
   previous image.

Social platforms cache previews too. Use their card debugger or re-scrape tool
to make them fetch the current image.
