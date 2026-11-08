import { useClerkAppearance } from "@/components/auth/use-clerk-appearance";
import Logo from "@/components/logo";
import { sanitizeRedirectPath, signInPath, signUpPath } from "@/lib/clerk-auth";
import { loadClerkUI } from "@/lib/clerk-ui";
import { SignIn, SignUp } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "vadivam-react";

function AuthPageShell({ children }: { children: ReactNode }) {
  // The page's Clerk form needs Clerk's UI bundle. Fetching it now, while
  // clerk-js loads, saves waiting for one after the other.
  useEffect(() => {
    loadClerkUI().catch(() => {
      // The form retries when it mounts.
    });
  }, []);

  return (
    <div className="bg-surface relative isolate flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-96 max-w-3xl bg-[radial-gradient(closest-side,var(--brand-muted),transparent)]"
      />
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to site
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 pt-6 pb-20">
        {children}
      </main>
    </div>
  );
}

/** Clerk's sign-in or sign-up form, which returns to `redirectUrl` after. */
export function AuthPage({
  form,
  redirectUrl,
}: {
  form: "sign-in" | "sign-up";
  redirectUrl?: string;
}) {
  const appearance = useClerkAppearance();
  const target = sanitizeRedirectPath(redirectUrl);
  const props = {
    appearance,
    routing: "path" as const,
    fallbackRedirectUrl: target,
    forceRedirectUrl: target,
  };
  return (
    <AuthPageShell>
      {form === "sign-in" ? (
        <SignIn {...props} path={signInPath} signUpUrl={signUpPath} />
      ) : (
        <SignUp {...props} path={signUpPath} signInUrl={signInPath} />
      )}
    </AuthPageShell>
  );
}
