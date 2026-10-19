---
title: "How Mosaic Refreshes OG Images"
description: "Mosaic retakes each page's screenshot automatically after 30 days."
category: "Guides"
publishedAt: "2025-06-20T12:05:00.000Z"
---

Mosaic refreshes images on its own.

1. The first request for a page URL takes a screenshot and caches it.
2. For the next 30 days, every request gets that cached image.
3. After 30 days, the next request takes a new screenshot.
4. If a daily limit is reached or the capture fails, it keeps serving the
   previous image.

## Regenerate one page now

Changed a single page? On the dashboard, find its image under **Latest OG
images** and click **Regenerate** (the circular arrow). Mosaic takes a new
screenshot right away. The old image keeps serving until the new one is saved,
and stays if the capture fails or a daily limit is reached; the page then
refreshes on its next request. Each regeneration counts toward your daily
screenshots.

## Regenerate a website's images now

After a redesign you don't have to wait 30 days. On the dashboard, open the
website's **…** menu and choose **Regenerate images**. This deletes every
image for that website. Each page gets a new screenshot the next time it's
requested, so that first request is slower. Images are shared by everyone who
saved the same hostname, so this resets them for all of them.

Until a page has its new screenshot, there is no previous image to fall back
on. If a daily limit is reached or the capture fails, that page shows the
example image until a later request succeeds. Links straight to an old
`/i/...` image stop working, so always point `og:image` at the `/use` URL.

Social platforms cache previews too. Use their card debugger or re-scrape tool
to make them fetch the current image.
