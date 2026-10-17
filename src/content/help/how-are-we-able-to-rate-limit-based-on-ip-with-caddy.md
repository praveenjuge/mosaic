---
title: "How We Rate Limited by IP with Caddy"
description: "How we set up IP-based rate limiting in Caddy with the caddy-ratelimit plugin."
publishedAt: "2024-10-04T07:51:36.232Z"
category: "Articles"
---

_This post describes an earlier Mosaic backend. Mosaic now runs on Cloudflare
Workers and uses Cloudflare's rate limiting instead._

We picked Caddy as our reverse proxy because it sets up and renews HTTPS on its
own and uses all CPU cores. If you want numbers, here's a
[Caddy vs Nginx benchmark](https://blog.tjll.net/reverse-proxy-hot-dog-eating-contest-caddy-vs-nginx/).

Here's a simplified version of the Caddyfile from one of our services:

```txt
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

## Build Caddy with the plugin

Caddy doesn't ship with rate limiting. Of the
[rate limit modules](https://caddyserver.com/docs/modules/http.handlers.rate_limit),
we chose [mholt/caddy-ratelimit](https://github.com/mholt/caddy-ratelimit)
because it was the simplest. Build a Caddy binary that includes it with
`xcaddy`:

```bash
xcaddy build --with github.com/mholt/caddy-ratelimit
```

Then replace your existing binary with the new one. Run `which caddy` to find
where it lives.

## The `rate_limit` directive

```txt
rate_limit {
        zone default {
                key {remote_host}
                events 45
                window 30s
        }
}
```

- `zone default` names the zone. We only needed one.
- `key {remote_host}` counts requests per client IP.
- `events 45` and `window 30s` allow 45 requests every 30 seconds. Anything
  over that gets a `429` response.

You can also rate limit in the application itself. Doing it in Caddy stops
abusive traffic before it reaches the app server. It helps against a DoS from a
single IP, but not a DDoS, where requests come from many rotating IPs.
