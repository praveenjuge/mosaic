import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.mosaicimg.com https://challenges.cloudflare.com https://exotic-lionfish-96.clerk.accounts.dev;
  connect-src 'self' https://clerk.mosaicimg.com https://api.github.com/graphql https://exotic-lionfish-96.clerk.accounts.dev;
  img-src 'self' https://img.clerk.com https://avatars.githubusercontent.com *;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  frame-src 'self' https://challenges.cloudflare.com;
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
`;

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    ppr: "incremental",
    optimizePackageImports: ["@mynaui/icons-react"],
  },
  async redirects() {
    return [
      {
        source: "/use",
        destination: "https://get.mosaicimg.com/image/get_image",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
