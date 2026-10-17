---
title: "HTML"
slug: "html"
description: "Add Mosaic to a static HTML site."
order: 70
svgLight: "html5"
svgDark: "html5"
---

```html
<head>
  <meta
    property="og:image"
    content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug"
  />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

On each page, set `url` to that page's encoded address (`:` is `%3A`, `/` is `%2F`). `twitter:card` makes X show a large image from `og:image`.
