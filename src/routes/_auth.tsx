import { dashboardPath } from "@/lib/clerk-auth";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.userId) {
      throw redirect({ to: dashboardPath, statusCode: 302 });
    }
  },
  component: Outlet,
});
