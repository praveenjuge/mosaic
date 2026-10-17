---
title: "Nuxt"
slug: "nuxt"
description: "Set og:image with Nuxt's useSeoMeta."
order: 50
---

In `app.vue` or a layout, to cover every page:

```vue
<script setup lang="ts">
const route = useRoute();

useSeoMeta({
  ogImage: () =>
    `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(`https://yourwebsite.com${route.path}`)}`,
});
</script>
```
