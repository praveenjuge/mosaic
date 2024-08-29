export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'development') {
    await import('./sentry.server.config');
  }
}
