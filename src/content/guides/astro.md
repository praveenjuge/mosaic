---
title: "Astro"
slug: "astro"
description: "Give every page an image from your Astro layout."
order: 40
svgLight: "astro-icon-light"
svgDark: "astro-icon-dark"
---

```astro
---
// src/layouts/Layout.astro
const pageUrl = new URL(Astro.url.pathname, Astro.site);
const ogImage = `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(pageUrl.href)}`;
---

<html lang="en">
  <head>
    <meta property="og:image" content={ogImage} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Set `site` in `astro.config.mjs` to your production URL.
