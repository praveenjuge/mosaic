import { publicEnv } from "@/lib/env";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const convexClient = new ConvexReactClient(publicEnv.convexUrl, {
    unsavedChangesWarning: false,
  });

  const router = createTanStackRouter({
    routeTree,
    context: {
      convexClient,
    },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
