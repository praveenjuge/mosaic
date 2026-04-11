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
  ogImage: "https://mosaicimg.com/use?url=yourwebsite.com/your_slug",
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
  ogImage: `https://mosaicimg.com/use?url=yourwebsite.com/${slug}`,
  ogType: "article",
});
</script>
```
