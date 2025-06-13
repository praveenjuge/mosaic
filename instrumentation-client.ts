// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production environments
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://140fb460c04aa6ae65f80ff720512a4c@o4509483678236672.ingest.us.sentry.io/4509483680268288",

    // Set environment for filtering in Sentry dashboard
    environment: process.env.NODE_ENV || "development",

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Sample rate for performance monitoring
    tracesSampleRate: 0.1,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;