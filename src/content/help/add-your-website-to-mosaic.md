---
title: "Add Your Website to Mosaic"
category: "Getting Started"
publishedAt: "2024-07-18T14:25:38.421Z"
---

- **Sign In to Mosaic**
- **Go to [Mosaic Dashboard](https://mosaic.praveenjuge.com)**
- **Click on the "Add Website" Button**
- **Enter Your Website URL**
- **Create the verification file shown in your dashboard** at
  `/.well-known/mosaic-verification.txt`
- **Click "Verify Website"** after the file is live over HTTPS
- **Copy the generation secret** and use it on your server or during the site
  build to sign each exact page URL

Mosaic only accepts production OG generation traffic after ownership is
verified. Editing a website to a different hostname requires verification again.

The dashboard provides a signed home-page URL. For other pages, create an
HMAC-SHA256 signature as described in the API guide, then place the resulting
URL in your site's `<meta property="og:image" />` tag.
