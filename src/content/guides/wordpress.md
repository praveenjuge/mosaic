---
title: "WordPress"
slug: "wordpress"
description: "Get started with integrating Mosaic into your WordPress project."
order: 100
---

## Add this to your theme's `functions.php`

```php
function add_dynamic_og_image() {
    global $post;
    $current_slug = $post->post_name;
    $og_image_url = 'https://mosaicimg.com/use?url=yourwebsite.com/' . $current_slug;

    echo '<meta property="og:image" content="' . esc_url($og_image_url) . '" />';
}
add_action('wp_head', 'add_dynamic_og_image');
```
