---
title: "Add Your Website to Mosaic"
description: "Add your site in the dashboard and copy its OG image link."
category: "Getting Started"
publishedAt: "2024-07-18T14:25:38.421Z"
---

1. Sign in at [mosaic.praveenjuge.com](https://mosaic.praveenjuge.com).
2. Click **Add Website** (or use the welcome form on your first visit).
3. Enter your site, like `example.com`, and submit.
4. Copy the link in the **URL** column. Until the site has an image, **Add to
   Your Website** also shows ready-made meta tags.

Mosaic saves only the hostname, with no verification step. `example.com`,
`www.example.com`, and `blog.example.com` are separate, so add each one you use.

Put the link in your `og:image` tag. For other pages, change the encoded page
URL:

```html
<meta
  property="og:image"
  content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fexample.com%2Fpricing"
/>
```

The first request takes the screenshot. It refreshes automatically after 30
days.
