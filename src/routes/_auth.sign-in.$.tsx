import { AuthPage } from "@/components/auth/auth-page";
import { validateRedirectSearch } from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
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
  return <AuthPage form="sign-in" redirectUrl={redirect_url} />;
}
