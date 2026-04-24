import { auth } from "@clerk/tanstack-react-start/server";
import { getDb } from "@/lib/db";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug")({
  server: {
    handlers: {
      GET: async () => {
        const { userId } = await auth();
        const db = getDb();

        const allSites = await db
          .prepare("SELECT id, user_id, url_base FROM sites LIMIT 10")
          .all();

        return new Response(
          JSON.stringify({
            clerkUserId: userId,
            sitesInDb: allSites.results,
          }, null, 2),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
