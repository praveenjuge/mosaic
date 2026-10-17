---
title: "Docusaurus"
slug: "docusaurus"
description: "Set og:image from Docusaurus front matter."
order: 110
---

Docusaurus turns the `image` front matter of a doc, blog post, or Markdown page into `og:image`:

```mdx
---
image: https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fdocs%2Fyour_slug
---
```

In React pages, use `<Head>` from `@docusaurus/Head`.
