---
title: "Astro"
slug: "astro"
description: "Get started with integrating Mosaic into your Astro project."
order: 40
svgLight: "astro-icon-light"
svgDark: "astro-icon-dark"
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Define variables in frontmatter and use them in `<head>`

```astro
---
const title = "Your Page Title";
const ogImage = "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&sig=SIGNATURE";
---

<html lang="en">
  <head>
    <title>{title}</title>
    <meta property="og:title" content={title} />
    <meta property="og:image" content={ogImage} />
  </head>
  <body>
    <h1>{title}</h1>
  </body>
</html>
```
