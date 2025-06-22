// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production environments
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set environment for filtering in Sentry dashboard
    environment: process.env.NODE_ENV || "development",

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Sample rate for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
