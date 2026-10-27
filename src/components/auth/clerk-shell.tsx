import {
  authenticatedHomePath,
  signInPath,
  signUpPath,
} from "@/lib/clerk-auth";
import { clerkFrontendApiOrigin } from "@/lib/clerk-frontend-api";
import { LazyClerkUI } from "@/lib/clerk-ui";
import { publicEnv } from "@/lib/env";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { preconnect } from "react-dom";

// Clerk's scripts and API calls go to its Frontend API host. Scripts load
// with `crossorigin="anonymous"` and API calls send cookies, which need
// separate connections.
const clerkOrigin = clerkFrontendApiOrigin(publicEnv.clerkPublishableKey);

/**
 * Clerk's provider, loaded only where Clerk is needed: for signed-in users
 * and on the sign-in and sign-up pages. Signed-out pages skip Clerk's
 * scripts, UI bundle, and API calls entirely, and signed-in pages skip the UI
 * bundle until a Clerk component opens (see `LazyClerkUI`).
 */
const clerkUI = { ClerkUI: LazyClerkUI };

export default function ClerkShell({ children }: { children: ReactNode }) {
  if (clerkOrigin) {
    preconnect(clerkOrigin, { crossOrigin: "anonymous" });
    preconnect(clerkOrigin);
  }

  return (
    <ClerkProvider
      publishableKey={publicEnv.clerkPublishableKey}
      signInUrl={signInPath}
      signUpUrl={signUpPath}
      signInFallbackRedirectUrl={authenticatedHomePath}
      signUpFallbackRedirectUrl={authenticatedHomePath}
      ui={clerkUI}
    >
      <InvalidateOnAuthChange />
      {children}
    </ClerkProvider>
  );
}

/**
 * Route auth and cached loader data depend on who is signed in, so reload
 * them when Clerk signs a user in or out without a full page load.
 */
function InvalidateOnAuthChange() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    const current = userId ?? null;
    if (
      previousUserId.current !== undefined &&
      previousUserId.current !== current
    ) {
      void router.invalidate();
    }
    previousUserId.current = current;
  }, [isLoaded, userId, router]);

  return null;
}
