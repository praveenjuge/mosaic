---
title: "Add Mosaic to Bear Blog"
category: "Guides"
publishedAt: "2024-09-16T17:21:41.891Z"
---

### Prerequisites

- **Have a Bear Blog**

  First, ensure you’ve created your Bear Blog at
  [bearblog.dev](https://bearblog.dev/). Your blog URL will look something like
  `yourblogname.bearblog.dev`. For example, check out our blog at
  [naveenhonestraj.bearblog.dev](https://naveenhonestraj.bearblog.dev/).

- **Sign up for Mosaic**

  Next, sign up for Mosaic and add your Bear Blog website to it. Our onboarding
  widget will guide you through this process, making it quick and easy to get
  started.

- **Get the URL from Mosaic**

  Once your website is set up in Mosaic, you’ll find the OG image URL under the
  **URL column** of your site’s page. Copy this URL, as you’ll need it for the
  integration.

---

### How to Add Mosaic to Bear Blog

Bear Blog is different from many modern blog platforms because it’s a fully
hosted solution, meaning you don’t need to build and deploy it locally. You can
simply log in and create blog posts with ease. Here’s how to integrate Mosaic
into Bear Blog and add OG images to your posts:

- **Create or edit a blog post**

  Start by either creating a new post or editing an existing one.

- **Add the** `meta_image` **attribute**

  In your post, you can add the following attributes to include an OG image:

  ```yaml
  title: How to integrate Mosaic in BearBlog.dev
  link: how-to-integrate-mosaic-in-bearblogdev
  meta_image: https://mosaicimg.com/use?url=https://yourblog.bearblog.dev/how-to-integrate-mosaic-in-bearblogdev
  ```

  - The `meta_image` field should contain the Mosaic image URL with the **link**
    parameter appended to it.
  - If you haven’t created a custom link for your post, simply publish your post
    with the title attribute first. Bear Blog will automatically generate a
    link, which you can then use in the `meta_image` field when you republish
    your post.

  **Tip:** This method allows you to dynamically generate beautiful OG images
  for your blog posts.

![](/images/screenshot-202024-09-16-20at-209.05.07-e2-80-afpm-AzMT.png)

---

### Updating Your Bear Blog Template (Optional)

If you want to make this process even easier, you can update your Bear Blog’s
template to automatically include a Mosaic OG image. Here’s how:

```yaml
title:
meta_image: https://mosaicimg.com/use?url=https://yourblog.bearblog.dev
___
```

By updating the template, every new post will have the OG image field
pre-filled. All you need to do is update the **URL** with the correct post link.

![](/images/screenshot-202024-09-16-20at-209.05.17-e2-80-afpm-A5MT.png)

---

### Optional: Updating the OG Image After a Theme Change

If you've recently updated your Bear Blog theme and want the OG images to
reflect the new design, there's no need to manually update each post. Simply
head over to Mosaic, locate your website, and click the **Refresh** button. This
will delete all existing OG images for that website, and new ones will be
automatically generated when you visit the pages again, ensuring everything
stays in sync with your new theme!

![](/images/screenshot-202024-09-16-20at-209.06.25-e2-80-afpm-c1MT.png)
