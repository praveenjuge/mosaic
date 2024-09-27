---
title: 'Add Mosaic to Hugo sites'
status: 'published'
author:
  name: 'Naveen Honest Raj'
  picture: 'https://avatars.githubusercontent.com/u/10878354?v=4'
slug: 'add-mosaic-to-hugo-sites'
description: ''
coverImage: ''
category: 'Guides'
publishedAt: '2024-09-27T08:38:56.976Z'
---

To generate OG images dynamically in your Hugo site using the image service, you can create a shortcode that will handle appending the current page URL to the base image service URL. Here’s a step-by-step guide to achieve this:

### Step 1: Find where your Meta tags are defined

1. **Search with the following keyword:** `meta property` or `og:image`
2. And you will find the meta property tags with `og:image` defined.

### Step 2: Replace them with the following snippet

Replace the meta property tags of og:images with the following snippet.

```html
{{- $baseURL := "<https://mosaicimg.com/use?url=>" -}}
{{- $pageURL := .Page.Permalink -}}
{{- $ogImageURL := printf "%s%s" $baseURL $pageURL -}}
<meta property="og:image" content="{{ $ogImageURL }}">
```

This shortcode constructs the full URL for the OG image by combining the base URL with the current page's permalink.

### Step 4: Test Your Site

1. **Run your Hugo site locally** to ensure everything is working correctly:

   ```
   hugo server
   
   ```

2. **Navigate to different pages** and inspect the HTML to verify that the OG image meta tag is being generated correctly with the appropriate URLs.