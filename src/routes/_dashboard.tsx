import Header from "@/components/header/header";
import { buildSignInHref } from "@/lib/clerk-auth";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.userId) {
      throw redirect({
        href: buildSignInHref(location.href),
        statusCode: 302,
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <>
      <div
        className="bg-primary pointer-events-none fixed -top-48 -right-48 size-96 opacity-15 blur-3xl select-none"
        aria-hidden="true"
      />
      <Header />
      <main className="mx-auto min-h-screen w-full max-w-6xl flex-1 space-y-10 px-4 pt-10 pb-6 md:px-10">
        <Outlet />
      </main>
    </>
  );
}
