---
title: "Understanding Usage Limits"
description: "Learn how Mosaic's shared OG image cache and service limits work."
category: "Guides"
publishedAt: "2025-06-13T11:30:36.000Z"
---

# Understanding Usage Limits

Mosaic uses a shared cache so the same page is captured once and reused for
everyone. There is no per-user image counter or signature setup.

## How Limits Work

### OG Image Generation

- A canonical page URL maps to one shared cached image
- Cached images refresh automatically after 30 days
- Requests normally reuse the cached image without taking a new screenshot
- Mosaic applies per-client and service-wide daily generation budgets to protect
  reliability and cost
- When a budget is exhausted, Mosaic serves the stale cached image when one is
  available, or a safe fallback image for a first request

### Website Management

- You can save websites to your account without ownership verification
- More than one user can save the same hostname
- Saving a website does not expose its page list, cache history, or other users
- Removing a website only removes your association; it does not delete shared
  images

## Tips

1. **Use stable canonical URLs**: query-string variations create distinct cache
   entries
2. **Use the page's final HTTPS URL**: redirects are followed safely before a
   screenshot is generated
3. **Let refresh happen automatically**: there is no manual purge step

## Need Help?

If you have questions about your usage or limits, contact support at
hello@praveenjuge.com.
