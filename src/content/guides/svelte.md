---
title: "SvelteKit"
slug: "svelte"
description: "Get started with integrating Mosaic into your SvelteKit project."
order: 90
---

## Use `svelte:head` for meta tags

```svelte
<svelte:head>
  <title>Your Page Title</title>
  <meta
    property="og:image"
    content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Your page content -->
```
