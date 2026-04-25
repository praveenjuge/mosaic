import { createMiddleware } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";

/**
 * Server function middleware that enforces Clerk authentication.
 *
 * Throws if the user is not signed in, making `context.userId`
 * available (as a non-null string) to every downstream handler.
 *
 * Usage:
 *   createServerFn()
 *     .middleware([authMiddleware])
 *     .handler(async ({ context }) => {
 *       context.userId; // string
 *     })
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("You must be signed in to perform this action.");
    }

    return next({ context: { userId } });
  },
);
