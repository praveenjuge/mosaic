---
title: "Astro"
slug: "astro"
description: "Get started with integrating Mosaic into your Astro project."
order: 40
svgLight: "astro"
svgDark: "astro_dark"
---

## Define variables in frontmatter and use them in `<head>`

```astro
---
const title = "Your Page Title";
const ogImage = "https://mosaicimg.com/use?url=yourwebsite.com/your_slug";
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
