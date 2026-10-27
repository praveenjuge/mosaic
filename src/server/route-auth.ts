import type { RouteAuth } from "@/lib/browser-route-auth";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const fetchRouteAuth = createServerFn().handler(
  async (): Promise<RouteAuth> => {
    const { userId } = await auth();

    return {
      userId,
      isAuthenticated: userId !== null,
    };
  },
);
