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

### Step 1: Create a Shortcode for the OG Image

1. **Navigate to your Hugo site's** `layouts/shortcodes` **directory**. If it doesn't exist, create it.
2. **Create a new file named** `ogimage.html` within this directory.

### Step 2: Define the Shortcode

In `ogimage.html`, add the following code:

```html
{{- $baseURL := "<https://mosaicimg.com/use?url=>" -}}
{{- $pageURL := .Page.Permalink -}}
{{- $ogImageURL := printf "%s%s" $baseURL $pageURL -}}
<meta property="og:image" content="{{ $ogImageURL }}">
```

This shortcode constructs the full URL for the OG image by combining the base URL with the current page's permalink.

### Step 3: Include the Shortcode in Your Head

1. **Open your** `layouts/_default/baseof.html` or wherever your HTML head is defined.
2. **Include the shortcode in the head section**:

```htmlbars
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Other meta tags -->
    {{< ogimage >}}
</head>
<body>
    <!-- Page content -->
</body>
</html>
```

This ensures that the OG image meta tag is included on every page of your site.

### Step 4: Test Your Site

1. **Run your Hugo site locally** to ensure everything is working correctly:

   ```
   hugo server
   
   ```

2. **Navigate to different pages** and inspect the HTML to verify that the OG image meta tag is being generated correctly with the appropriate URLs.

### Optional: Customize for Specific Pages

If you need different OG images for specific pages, you can pass a custom URL to the shortcode. Modify the `ogimage.html` shortcode to accept an optional parameter:

```html
{{- $baseURL := "<https://mosaicimg.com/use?url=>" -}}
{{- $pageURL := .Get "url" | default .Page.Permalink -}}
{{- $ogImageURL := printf "%s%s" $baseURL $pageURL -}}
<meta property="og:image" content="{{ $ogImageURL }}">
```

Then you can use the shortcode with or without a custom URL parameter:

```html
<!-- Default usage -->
{{< ogimage >}}

<!-- Custom URL usage -->
{{< ogimage url="<https://example.com/custom-page>" >}}
```

By following these steps, you’ll have a dynamic OG image generation setup in your Hugo site using the specified image service.