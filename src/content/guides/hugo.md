---
title: "Hugo"
slug: "hugo"
description: "Give every page an image from your Hugo template."
order: 60
---

In the `<head>` of your base template or head partial:

```html
<meta
  property="og:image"
  content="https://mosaic.praveenjuge.com/use?url={{ .Permalink | urlquery }}"
/>
```

`.Permalink` uses `baseURL`, so set that to your production URL.
