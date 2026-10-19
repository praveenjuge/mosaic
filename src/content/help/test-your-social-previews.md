---
title: "Test Your Social Previews"
description: "Which meta tags to add, what size Mosaic's images are, and how to check a link preview on each platform."
category: "Troubleshooting"
publishedAt: "2026-10-19T09:00:00.000Z"
---

A link preview needs two things: the right tags in your page's `<head>`, and
an image the platform's crawler can download. Mosaic handles the image. This
page covers the tags and how to check the result.

## The tags to add

Add both the Open Graph and the X (Twitter) tags. X falls back to `og:image`,
but `twitter:card` is what makes it show a large image instead of a small
thumbnail.

```html
<meta
  property="og:image"
  content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fexample.com%2Fpricing"
/>
<meta property="og:image:width" content="1560" />
<meta property="og:image:height" content="819" />
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:image"
  content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fexample.com%2Fpricing"
/>
```

On the dashboard, **Get code** on a website builds these tags for any page:
type the page's path and copy them. The `url` parameter is the page's full
address, URL-encoded. Use the page's canonical address, the one people share,
so every share reuses one image.

## Image size and format

- **Size:** 1560×819 pixels, the 1.91:1 shape Facebook, LinkedIn, X, Slack,
  and Discord use for large link previews. The width and height tags above let
  some platforms lay out the preview before the image downloads.
- **Format:** JPEG at quality 80, a few hundred KB at most, well under every
  platform's limit (X's is 5 MB).
- **What's in it:** the top of the page, as a visitor sees it on a wide
  screen. Cookie banners, chat widgets, and analytics scripts are left out.

## How crawlers get the image

`/use` answers with a `307` redirect to the image's permanent address under
`/i/`. Every major crawler follows redirects. The first request for a new page
takes the screenshot, which can take a few seconds; later requests get the
saved image at once.

## Check a preview

Each platform caches previews, often for days. After you change a tag, ask the
platform to fetch the page again:

- **Facebook, Instagram, Threads, WhatsApp:**
  [Sharing Debugger](https://developers.facebook.com/tools/debug/). Choose
  **Scrape Again** to refresh its copy.
- **LinkedIn:** [Post Inspector](https://www.linkedin.com/post-inspector/).
  Inspecting a URL refreshes LinkedIn's cache.
- **X:** there's no public validator. Paste the link in a new post and wait
  for the preview. X can keep an old preview for about a week.
- **Slack and Discord:** paste the link in a message.
- **Any platform:** [metatags.io](https://metatags.io/) and
  [opengraph.xyz](https://www.opengraph.xyz/) show how a page will look on
  several platforms at once.

To check the image itself, open the `/use` link in a browser. You should see
the screenshot.

## Common problems

- **No image at all:** make sure the tag is in the HTML the server sends, not
  added later by JavaScript. Crawlers don't run scripts. View the page source
  to check.
- **A grey or example image:** the hostname isn't saved in Mosaic, or a daily
  limit was reached before the first screenshot. Add the website on the
  dashboard, then see [Understanding Usage Limits](/help/understanding-usage-limits).
- **An old screenshot:** images refresh after 30 days. To update one now, use
  **Regenerate** next to it on the dashboard, then scrape the page again in
  the platform's debugger. See
  [How Mosaic Refreshes OG Images](/help/refresh-og-images-for-a-website).
- **A small square thumbnail on X:** add `twitter:card` with the value
  `summary_large_image`.
- **The wrong page in the image:** the `url` parameter must be the page's own
  address, encoded. An unencoded `?` or `&` in it cuts the address short.
