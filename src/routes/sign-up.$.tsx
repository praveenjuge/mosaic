import {
  dashboardPath,
  fetchClerkAuth,
  sanitizeRedirectPath,
  signInPath,
  signUpPath,
} from "@/lib/clerk-auth";
import { pageTitle } from "@/lib/seo";
import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
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
      { title: pageTitle("Sign Up") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect_url } = Route.useSearch();
  const redirectUrl = sanitizeRedirectPath(redirect_url);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4 py-10">
      <SignUp
        path={signUpPath}
        routing="path"
        signInUrl={signInPath}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
