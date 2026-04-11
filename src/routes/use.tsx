import { publicEnv } from "@/lib/env";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/use")({
  beforeLoad: ({ location }) => {
    const targetUrl = new URL("use", publicEnv.convexSiteUrl);
    targetUrl.search = location.searchStr;

    throw redirect({
      href: targetUrl.toString(),
      statusCode: 307,
    });
  },
  component: () => null,
});
