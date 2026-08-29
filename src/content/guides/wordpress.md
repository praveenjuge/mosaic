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
    $page_url = rawurlencode('https://yourwebsite.com/' . $current_slug);
    $og_image_url = 'https://mosaic.praveenjuge.com/use?url=' . $page_url;

    echo '<meta property="og:image" content="' . esc_url($og_image_url) . '" />';
}
add_action('wp_head', 'add_dynamic_og_image');
```
