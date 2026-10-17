---
title: "How to Run Your Own OG Image Creator"
description: "Build a simple screenshot-based OG image generator with Python and Playwright."
publishedAt: "2024-08-29T08:16:13.093Z"
category: "Articles"
---

Open Graph (OG) images are the preview pictures that appear when you share a
link on social media. You don't need design skills to make one. A screenshot of
the page works well, and you can take it with a few lines of Python.

To see your site's current OG image, try [opengraph.xyz](https://www.opengraph.xyz/).

## Setup

We'll use [Playwright](https://playwright.dev/python/), which controls a real
browser. In your terminal (inside a virtualenv if you like), run:

```bash
pip install playwright
playwright install
```

The second command downloads browsers, so it takes a while.

## The code

Create a file called `og_image.py`:

```python
from playwright.sync_api import sync_playwright


def capture_og_image(url, output_file):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.goto(url)
        page.screenshot(path=output_file, full_page=False)
        browser.close()


capture_og_image("https://mosaic.praveenjuge.com/", "og_image.png")
```

Run it with `python og_image.py`. You'll get `og_image.png`, a screenshot of the
page at 1200 × 630 pixels, the standard OG image size.

## How it works

1. Playwright launches a headless Chromium browser.
2. It opens a page with a 1200 × 630 viewport.
3. It loads the URL.
4. It saves a screenshot of the visible area.

Change the URL and file name to capture your own pages, or loop over a list of
URLs to capture many.

## Going further

A production version also needs to host the images, cache them, refresh them
over time, and block requests to private networks.
[Mosaic](https://mosaic.praveenjuge.com/) does all of that for you.
