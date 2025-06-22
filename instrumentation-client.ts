// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production environments
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment for filtering in Sentry dashboard
    environment: process.env.NODE_ENV || "development",

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Sample rate for performance monitoring
    tracesSampleRate: 0.1,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;