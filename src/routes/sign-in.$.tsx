import {
  dashboardPath,
  fetchClerkAuth,
  sanitizeRedirectPath,
  signInPath,
  signUpPath,
} from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();

    if (userId) {
      throw redirect({ to: dashboardPath, statusCode: 302 });
    }
  },
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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4 py-10">
      <SignIn
        path={signInPath}
        routing="path"
        signUpUrl={signUpPath}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
