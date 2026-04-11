import { authenticatedHomePath } from "@/lib/clerk-auth";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.userId) {
      throw redirect({ to: authenticatedHomePath, statusCode: 302 });
    }
  },
  component: Outlet,
});
