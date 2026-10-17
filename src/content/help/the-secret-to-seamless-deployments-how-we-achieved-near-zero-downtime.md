---
title: "The Secret to Seamless Deployments: How We Achieved Near-Zero Downtime"
description: "How we deployed a slow-starting Docker app behind Caddy with near-zero downtime."
publishedAt: "2024-11-09T09:23:19.552Z"
category: "Articles"
---

_This post describes an earlier Mosaic backend. Mosaic now runs on Cloudflare
Workers._

Our backend took a while to start, and we wanted to deploy it without downtime.
Platforms like Heroku, Fly, and Appliku handle this for you, but this time we
wanted to do it ourselves.

## Our setup

The app was a Python service in a Docker container. Caddy sat in front as a
reverse proxy and forwarded traffic to the container's port.

![Caddy reverse proxy on ports 80 and 443 forwarding to Gunicorn workers on port 8000 or 8001, which run the backend application](/images/blog-post-gyMT.png)

## The Dockerfile

The app used Playwright to take screenshots (see
[How to Run Your Own OG Image Creator](/help/how-to-run-your-own-og-image-creator)),
so the image installs it before the app code. Here's a trimmed version:

```docker
# Use an official Python runtime as the base image
FROM python:3.11.2

# Set the working directory
WORKDIR /code/

COPY ./requirements.txt /code/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its browsers
RUN pip install playwright
RUN playwright install-deps
RUN playwright install

# Copy the rest of the application code
COPY . /code/

EXPOSE 8000
EXPOSE 8001
```

## Building and running

Build the image:

```bash
docker build . -t app-backend
```

Run it on port 8000:

```bash
docker run -d -p 8000:8000 app-backend gunicorn app.main:app -c gunicorn.conf.py
```

The simple way to ship new code is to rebuild, `docker stop` the container, and
run it again. Everything between the stop and the new container being ready is
downtime. For a slow-starting app, that's several seconds. We wanted it under
about 500 ms.

## Swapping containers

Instead of stopping the old container first, we ran the new one alongside it:

1. Rebuild the image with the new code. The running container (call it **old**)
   keeps using the previous image.
2. Start a **new** container on port 8001 instead of 8000.
3. Change the Caddyfile to proxy to port 8001.
4. Reload Caddy. New requests now go to the new code.
5. Stop the old container to free its resources.

## Two safety checks

- **Only switch when the new container is healthy.** `docker run` supports
  health checks. If the new code fails them, the container stops, Caddy is never
  changed, and users keep using the old version.
- **Stop the old container only after the Caddy reload.** Until then it's still
  serving traffic.

Next deploy, swap the ports back. This
[gist](https://gist.github.com/Navdevl/0e34061880b5d91cd38c12364d81770c) has a
script to get you started.
