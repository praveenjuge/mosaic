---
title: "WordPress"
slug: "wordpress"
description: "Add og:image to WordPress posts and pages."
order: 100
---

In your child theme's `functions.php`:

```php
add_action('wp_head', function () {
    if (!is_singular()) {
        return;
    }

    $og_image = 'https://mosaic.praveenjuge.com/use?url=' . rawurlencode(get_permalink());
    echo '<meta property="og:image" content="' . esc_url($og_image) . '" />';
});
```

If an SEO plugin like Yoast already prints `og:image`, set it there instead.
