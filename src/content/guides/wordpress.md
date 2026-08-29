---
title: "WordPress"
slug: "wordpress"
description: "Get started with integrating Mosaic into your WordPress project."
order: 100
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Add this to your theme's `functions.php`

```php
function add_dynamic_og_image() {
    global $post;
    $current_slug = $post->post_name;
    $signature = 'SIGNATURE';
    $page_url = rawurlencode('https://yourwebsite.com/' . $current_slug);
    $og_image_url = 'https://mosaic.praveenjuge.com/use?url=' . $page_url . '&sig=' . $signature;

    echo '<meta property="og:image" content="' . esc_url($og_image_url) . '" />';
}
add_action('wp_head', 'add_dynamic_og_image');
```
