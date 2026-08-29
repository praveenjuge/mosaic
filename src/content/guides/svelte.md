---
title: "SvelteKit"
slug: "svelte"
description: "Get started with integrating Mosaic into your SvelteKit project."
order: 90
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Use `svelte:head` for meta tags

```svelte
<svelte:head>
  <title>Your Page Title</title>
  <meta
    property="og:image"
    content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&amp;sig=SIGNATURE"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Your page content -->
```
