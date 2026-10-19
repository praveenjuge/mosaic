---
title: "Understanding Usage Limits"
description: "How Mosaic's daily screenshot limits work and what happens when one is reached."
category: "Guides"
publishedAt: "2025-06-13T11:30:36.000Z"
---

Mosaic takes one screenshot per page URL and shares it with everyone. Only new
screenshots count toward limits, not cached images.

## Daily screenshot limits

- **`/use` links:** 50 new screenshots per client IP per day, and 500 per day
  across the service, with a short-term cap of 30 per client IP per minute.
- **Home page demo:** 10 per client IP per day, and 100 per day across the
  service.

Days reset at midnight UTC. The client is whoever requests the image, usually a
social platform's crawler. Screenshots you start from the dashboard (adding a
website, regenerating a page) count against your account instead, also 50 per
day. Limits are the same on every plan.

The dashboard's **Today's usage** panel shows how many of your screenshots and
of the service's daily screenshots are used so far.

## When a limit is reached

`/use` still redirects to an image:

- You get the page's older cached image, if it has one.
- Otherwise you get a fallback example image until a screenshot can be taken.

## Websites

- Add as many websites as you like, with no ownership check.
- Several accounts can save the same hostname without seeing each other.
- If no account has a hostname saved, `/use` returns a 404 error for it.

## Tips

1. **Keep URLs stable.** Each distinct URL, including different query strings,
   gets its own screenshot.
2. **Use the page's final HTTPS URL.** Mosaic follows redirects, but a direct
   link is cleaner.

Questions about limits? Email hello@praveenjuge.com.
