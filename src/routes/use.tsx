import { publicEnv } from "@/lib/env";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/use")({
  beforeLoad: () => {
    throw redirect({
      href: `${publicEnv.convexUrl.replace(/\/$/, "")}/use`,
      statusCode: 307,
    });
  },
  component: () => null,
});
