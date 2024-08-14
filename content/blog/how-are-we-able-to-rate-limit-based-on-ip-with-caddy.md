---
title: "How are we able to rate limit based on IP with Caddy"
status: "published"
author:
  name: "Praveen Juge"
  picture: "https://avatars.githubusercontent.com/u/13696888?v=4"
slug: "how-are-we-able-to-rate-limit-based-on-ip-with-caddy"
description: "Step-by-step guide to setting up IP-based rate limiting in Caddy for enhanced security and performance."
coverImage: ""
publishedAt: "2024-08-01T07:51:36.232Z"
---

I am not starting another Caddy vs Nginx war, but I’ve decided to go with Caddy. I was impressed when I heard that I am getting HTTPS configuration and renewal parts automated out-of-the-box with Caddy. Plus, it can take advantage of all the cores of the system, which I believe should be a good thing. I am always up for using all the available resources and putting them to good use.

If you are very interested in reading about benchmarks done with Nginx and Caddy, here’s one for you all. <https://blog.tjll.net/reverse-proxy-hot-dog-eating-contest-caddy-vs-nginx/>

Let’s get started with understanding how easy it is to implement IP-based rate limiting on Caddy. Here’s a simplified version of the Caddyfile we have in one of our services.

```docker
subdomain.example.com {
        encode gzip zstd

        header {
                Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
                X-Content-Type-Options "nosniff"
                X-Frame-Options "DENY"
                Referrer-Policy "strict-origin-when-cross-origin"
        }

        reverse_proxy localhost:8001 {
                header_up Host {host}
                header_up X-Real-IP {remote_host}
                header_up X-Forwarded-For {remote_host}
                header_up X-Forwarded-Proto {scheme}

                header_down Cache-Control "public, max-age=600"
                header_down Vary "Accept-Encoding"

                transport http {
                        keepalive 30s
                        keepalive_idle_conns 100
                }
        }

        rate_limit {
                zone default {
                        key {remote_host}
                        events 45
                        window 30s
                }
        }

        log {
                output file /var/log/caddy/subdomain.example.com.log {
                        roll_size 10MB
                        roll_keep 5
                        roll_keep_for 720h
                }
        }
}
```

## Building Caddy

Caddy doesn't come with plugins installed with it, but you can build your caddy binary using `xcaddy` and give whatever power pack you want it to have and in our case rate rate-limiting option.

From the HTTP`. handlers` that support rate limiting as per Caddy’s site <https://caddyserver.com/docs/modules/http.handlers.rate_limit>, we went ahead with mholt’s implementation because it was easy to understand, and gave us the simplest way to do the task we wanted to do. <https://github.com/mholt/caddy-ratelimit>

You build your caddy using `xcaddy` by following the command

```bash
xcaddy build --with github.com/mholt/caddy-ratelimit
```

This will output a caddy binary which you should replace your caddy with. You can find where your caddy resides by simply running `which caddy` and that is the one you want to replace with.

## The `rate_limit` directives

We are not going over all the directives but focus only on the `rate_limit` one.

```
rate_limit {
        zone default {
                key {remote_host}
                events 45
                window 30s
        }
}
```

You can define a zone under the `rate_limit` directive and give it a name, in our case we had only one zone, so we gave it `default` as an identifier. The way we wanted to rate-limit is by using the IP, which is the `remote_host` and we wanted to allow 45 requests in a window of 30s. Anything above will return a 429 as the response.

There is so much we can factor in for writing rate_limit logic, and you can also write rate limits at the application server as well, but this helps us block a few unnecessary attacks and there by helping us not to load the application server. This prevents DOS, but not DDOS because DDOS have their IPs rotated and they will not be picked up by this rate limit logic.
