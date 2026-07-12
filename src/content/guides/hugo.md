---
title: "Hugo"
slug: "hugo"
description: "Get started with integrating Mosaic into your Hugo project."
order: 60
---

## Add this to your layout template

```html
{{ $baseURL := "https://mosaic.praveenjuge.com/use?url=" }} {{ $pageURL :=
.Page.Permalink }} {{ $ogImageURL := printf "%s%s" $baseURL $pageURL }}
<meta property="og:image" content="{{ $ogImageURL }}" />
```
