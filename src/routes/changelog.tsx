import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/changelog")({
  beforeLoad: () => {
    throw redirect({ href: "/#latest-updates", statusCode: 301 });
  },
  component: () => null,
});
