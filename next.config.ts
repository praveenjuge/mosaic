import type { NextConfig } from "next";

const cspHeader = `
  img-src 'self' https://img.clerk.com https://avatars.githubusercontent.com https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev *;
  font-src 'self' https://fonts.gstatic.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://www.gstatic.com;
  frame-src 'self' https://challenges.cloudflare.com;
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
`;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, "").replace(/\s{2,}/g, " "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "same-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/use",
        destination: `${process.env.CONVEX_SITE_URL}/use`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
