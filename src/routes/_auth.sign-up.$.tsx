import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { useClerkAppearance } from "@/components/auth/use-clerk-appearance";
import {
  sanitizeRedirectPath,
  signInPath,
  signUpPath,
  validateRedirectSearch,
} from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/sign-up/$")({
  validateSearch: validateRedirectSearch,
  head: () => ({
    meta: [
      { title: pageTitle("Sign Up") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl = sanitizeRedirectPath(redirect_url);
  const appearance = useClerkAppearance();

  return (
    <AuthPageShell>
      <SignUp
        appearance={appearance}
        path={signUpPath}
        routing="path"
        signInUrl={signInPath}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </AuthPageShell>
  );
}
