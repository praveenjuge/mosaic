import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { useClerkAppearance } from "@/components/auth/use-clerk-appearance";
import {
  sanitizeRedirectPath,
  signInPath,
  signUpPath,
  validateRedirectSearch,
} from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/sign-in/$")({
  validateSearch: validateRedirectSearch,
  head: () => ({
    meta: [
      { title: pageTitle("Sign In") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl = sanitizeRedirectPath(redirect_url);
  const appearance = useClerkAppearance();

  return (
    <AuthPageShell>
      <SignIn
        appearance={appearance}
        path={signInPath}
        routing="path"
        signUpUrl={signUpPath}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </AuthPageShell>
  );
}
