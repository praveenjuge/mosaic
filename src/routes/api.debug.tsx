import { auth } from "@clerk/tanstack-react-start/server";
import { getDb } from "@/lib/db";
import { getDashboardStats } from "@/server/stats";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const debugInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  const db = getDb();

  const allSites = await db
    .prepare("SELECT id, user_id, url_base FROM sites LIMIT 10")
    .all();

  let statsResult = null;
  try {
    statsResult = await getDashboardStats();
  } catch (e) {
    statsResult = { error: String(e) };
  }

  return {
    clerkUserId: userId,
    sitesInDb: allSites.results,
    statsResult,
  };
});

export const Route = createFileRoute("/api/debug")({
  loader: async () => {
    return await debugInfo();
  },
  component: () => {
    const data = Route.useLoaderData();
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
  },
});
