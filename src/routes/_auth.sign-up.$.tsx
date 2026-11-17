import { AuthPage } from "@/components/auth/auth-page";
import { validateRedirectSearch } from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
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
  return <AuthPage form="sign-up" redirectUrl={redirect_url} />;
}
