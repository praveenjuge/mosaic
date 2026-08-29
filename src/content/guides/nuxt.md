---
title: "Nuxt"
slug: "nuxt"
description: "Get started with integrating Mosaic into your Nuxt project."
order: 50
---

## Use `useSeoMeta`

```vue
<script setup>
useSeoMeta({
  title: "My Page Title",
  ogTitle: "My Page Title",
  ogImage:
    "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug",
  ogType: "website",
});
</script>
```

## For dynamic pages

```vue
<script setup>
const route = useRoute();
const slug = route.params.slug;

useSeoMeta({
  title: `Post: ${slug}`,
  ogTitle: `Post: ${slug}`,
  ogImage: `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(`https://yourwebsite.com/${slug}`)}`,
  ogType: "article",
});
</script>
```
