---
title: "Add Mosaic to Nuxt.js sites"
category: "Guides"
publishedAt: "2024-09-27T08:48:06.079Z"
---

In this guide, we'll walk you through how to integrate Mosaic's dynamic Open Graph (OG) image generation service into a Nuxt.js app. Mosaic generates OG images based on the URL of the current page, and we’ll show you how to set this up in Nuxt.

#### Dynamic OG Image Integration

Mosaic provides an image URL that requires a query parameter: the current page URL. Here’s how to set that up dynamically in your Nuxt app so that each page generates its own OG image.

### Step 1: Dynamic Meta Tags in Nuxt Pages

Nuxt allows you to configure Open Graph meta tags dynamically by using the `head` property inside your page components. This is how you can set the OG image to reflect the current page’s URL.

#### Example:

In your page component, use the following code to dynamically generate the OG image URL:

```html
<template>
  <div>
    <!-- Your page content -->
  </div>
</template>

<script>
  export default {
    head() {
      const currentUrl = this.$route.fullPath; // Get current route path
      const mosaicUrl = `https://mosaicimg.com/use?url=${encodeURIComponent(currentUrl)}`;

      return {
        meta: [
          {
            hid: "og:title",
            property: "og:title",
            content: "Dynamic Page Title",
          },
          {
            hid: "og:description",
            property: "og:description",
            content: "Dynamic Page Description",
          },
          { hid: "og:image", property: "og:image", content: mosaicUrl },
        ],
      };
    },
  };
</script>
```

### Step 2: Global OG Image Generation

If you want to apply the OG image to every page globally, modify the `nuxt.config.js` file. Use `window.location.href` to fetch the current URL client-side:

```javascript
export default {
  head() {
    let pageUrl = "";
    if (process.browser) {
      pageUrl = window.location.href;
    }

    const mosaicUrl = `https://mosaicimg.com/use?url=${encodeURIComponent(pageUrl)}`;

    return {
      meta: [
        { hid: "og:title", property: "og:title", content: "Global Page Title" },
        {
          hid: "og:description",
          property: "og:description",
          content: "Global Page Description",
        },
        { hid: "og:image", property: "og:image", content: mosaicUrl },
      ],
    };
  },
};
```

This will ensure the OG image is generated dynamically based on the current URL.

### Conclusion

Integrating Mosaic with Nuxt.js is straightforward and allows you to automatically generate dynamic OG images for each page. Whether you implement this on a per-page basis or globally, Mosaic simplifies the process of creating visually engaging previews for your content.

For further customization or advanced use cases, feel free to reach out to us.
