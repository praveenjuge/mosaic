---
title: "Hugo"
slug: "hugo"
description: "Get started with integrating Mosaic into your Hugo project."
order: 60
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Add this to your layout template

```html
{{ $baseURL := "https://mosaic.praveenjuge.com/use?url=" }} {{ $pageURL :=
.Page.Permalink }} {{ $signature := "SIGNATURE" }} {{ $ogImageURL := printf
"%s%s&sig=%s" $baseURL ($pageURL | urlquery) $signature }}
<meta property="og:image" content="{{ $ogImageURL }}" />
```
