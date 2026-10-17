import type { RouteAuth } from "@/lib/browser-route-auth";
import { preloadableLazy } from "@/lib/preloadable-lazy";

// Clerk's React code lives in these chunks, so signed-out pages download
// none of it. `ClerkShell` also loads Clerk's own scripts from its CDN.
export const clerkShell = preloadableLazy(
  () => import("@/components/auth/clerk-shell"),
);
export const headerSignedIn = preloadableLazy(
  () => import("@/components/header/header-signed-in"),
);

const authPaths = ["/sign-in", "/sign-up"];

/** Clerk runs for signed-in users and on the sign-in and sign-up pages. */
export function needsClerk(auth: RouteAuth, pathname: string) {
  return (
    auth.userId !== null ||
    authPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  );
}

/** Loads the chunks a page needs, so it renders without suspending. */
export async function preloadClerkChunks(auth: RouteAuth, pathname: string) {
  if (!needsClerk(auth, pathname)) return;
  await Promise.all([
    clerkShell.preload(),
    auth.userId ? headerSignedIn.preload() : undefined,
  ]);
}
