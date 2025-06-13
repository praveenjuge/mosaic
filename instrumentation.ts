import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Only register Sentry in production environments
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}

// Only export onRequestError if Sentry is initialized
export const onRequestError = process.env.NODE_ENV === 'production'
  ? Sentry.captureRequestError
  : undefined;
