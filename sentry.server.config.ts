// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6f06d433e7a6305b03b97f3f41512405@o4507550048518144.ingest.de.sentry.io/4507696876617808",
  tracesSampleRate: 1,
  debug: false,
});
