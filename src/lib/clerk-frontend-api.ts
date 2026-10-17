/**
 * The origin of Clerk's Frontend API, which serves Clerk's scripts and API.
 * Publishable keys are `pk_<instance>_` + base64("<frontend API host>$").
 * Returns `null` for a key that doesn't have that shape.
 */
export function clerkFrontendApiOrigin(publishableKey: string) {
  const match = /^pk_(?:live|test)_([A-Za-z0-9+/=]+)$/.exec(publishableKey);
  if (!match) return null;
  let decoded: string;
  try {
    decoded = atob(match[1]);
  } catch {
    return null;
  }
  const host = decoded.endsWith("$") ? decoded.slice(0, -1) : "";
  return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
}
