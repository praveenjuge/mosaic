import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/changelog/$slug")({
  beforeLoad: () => {
    throw redirect({ href: "/", statusCode: 301 });
  },
  component: () => null,
});
