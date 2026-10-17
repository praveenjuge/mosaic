---
title: "SvelteKit"
slug: "svelte"
description: "Set og:image with svelte:head."
order: 90
---

In `src/routes/+layout.svelte` (SvelteKit 2.12+):

```svelte
<script>
  import { page } from "$app/state";

  let { children } = $props();
</script>

<svelte:head>
  <meta
    property="og:image"
    content="https://mosaic.praveenjuge.com/use?url={encodeURIComponent(`https://yourwebsite.com${page.url.pathname}`)}"
  />
</svelte:head>

{@render children()}
```
