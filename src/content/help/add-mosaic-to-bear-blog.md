---
title: "Add Mosaic to Bear Blog"
description: "Use Bear Blog's meta_image attribute to give each post a Mosaic OG image."
category: "Guides"
publishedAt: "2024-09-16T17:21:41.891Z"
---

## Before you start

1. Have a blog on [Bear Blog](https://bearblog.dev/). Its address looks like
   `yourblog.bearblog.dev`.
2. Sign in to Mosaic and add that hostname as a website. If your blog uses a
   custom domain, add the custom domain instead.
3. Click **Get code** on the website's row and choose **Copy image link**.

## Add an OG image to a post

Bear Blog is fully hosted, so you set the image in each post's attributes. There
is nothing to build or deploy.

1. Create a post or edit an existing one.
2. Add a `meta_image` attribute. Set it to the Mosaic endpoint, with the post's
   full URL (encoded) as the `url` parameter:

   ```yaml
   title: How to integrate Mosaic in BearBlog.dev
   link: how-to-integrate-mosaic-in-bearblogdev
   meta_image: https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourblog.bearblog.dev%2Fhow-to-integrate-mosaic-in-bearblogdev
   ```

3. Publish the post.

No `link` yet? Publish once so Bear Blog creates one from the title. Then add
that link to `meta_image` and publish again.

![Bear Blog post editor with title, link, and meta_image attributes](/images/bear-blog-post-editor-1720w-105549cd.webp)

## Pre-fill new posts (optional)

Bear Blog's post template fills in every new post. Add `meta_image` there:

```yaml
title:
meta_image: https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourblog.bearblog.dev
___
```

In each new post, change the encoded URL to that post's address. If you leave
the home page URL, every post shares the home page image.

![Bear Blog post template with a meta_image attribute](/images/bear-blog-post-template-1720w-508288fb.webp)

## After a theme change

Mosaic takes a new screenshot on the first request after an image is 30 days
old. To update them sooner, choose **Regenerate images** from the website's
**…** menu on the dashboard. Social platforms also cache previews, so use
their card debugger or re-scrape tool to make them fetch the image again.
