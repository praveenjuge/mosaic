import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.mosaicimg.com https://challenges.cloudflare.com https://exotic-lionfish-96.clerk.accounts.dev https://fonts.gstatic.com https://counterscale.praveenjuge.com https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev;
  connect-src 'self' https://clerk.mosaicimg.com https://api.github.com/graphql https://exotic-lionfish-96.clerk.accounts.dev https://fonts.gstatic.com https://counterscale.praveenjuge.com https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev https://api.cloudflare.com https://rfakjrmmesuwwvhplopd.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io;
  img-src 'self' https://img.clerk.com https://avatars.githubusercontent.com https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev *;
  font-src 'self' https://fonts.gstatic.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  frame-src 'self' https://challenges.cloudflare.com;
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  report-uri https://o4509483678236672.ingest.us.sentry.io/api/4509483680268288/security/?sentry_key=140fb460c04aa6ae65f80ff720512a4c&sentry_environment=${process.env.NODE_ENV || 'development'};
  report-to csp-endpoint;
  ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
`;

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    reactCompiler: true,
    nodeMiddleware: true,
    optimizePackageImports: ["@mynaui/icons-react"],
  },
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
  async redirects() {
    return [
      {
        source: '/analytics',
        destination: '/',
        permanent: false,
      },
      {
        source: '/websites',
        destination: '/',
        permanent: false,
      },
      {
        source: '/websites/:slug*',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async headers() {
    const sentryReportEndpoint = `https://o4509483678236672.ingest.us.sentry.io/api/4509483680268288/security/?sentry_key=140fb460c04aa6ae65f80ff720512a4c&sentry_environment=${process.env.NODE_ENV || 'development'}`;

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, "").replace(/\s{2,}/g, " "),
          },
          {
            key: "Report-To",
            value: JSON.stringify({
              group: "csp-endpoint",
              max_age: 10886400,
              endpoints: [{ url: sentryReportEndpoint }],
              include_subdomains: true,
            }),
          },
          {
            key: "Reporting-Endpoints",
            value: `csp-endpoint="${sentryReportEndpoint}"`,
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
};

const sentryWebpackPluginOptions = { silent: true };

export default withSentryConfig(withSentryConfig(withSentryConfig(nextConfig, sentryWebpackPluginOptions), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "mosaic-ao",
  project: "sentry-cyan-zebra",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
}), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "mosaic-ao",
  project: "sentry-cyan-zebra",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});