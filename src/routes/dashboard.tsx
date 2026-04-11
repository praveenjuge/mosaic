import { authenticatedHomePath } from "@/lib/clerk-auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: authenticatedHomePath, statusCode: 302 });
  },
});
