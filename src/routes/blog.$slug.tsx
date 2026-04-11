import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      params,
      statusCode: 301,
      to: "/help/$slug",
    });
  },
  component: () => null,
});
