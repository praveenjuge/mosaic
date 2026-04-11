import SignedInDashboard from "@/components/home/SignedInDashboard";
import { buildSignInHref, fetchClerkAuth } from "@/lib/clerk-auth";
import { buildSeoMeta } from "@/lib/seo";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard")({
  beforeLoad: async ({ location }) => {
    const { userId } = await fetchClerkAuth();

    if (!userId) {
      throw redirect({
        href: buildSignInHref(location.href),
        statusCode: 302,
      });
    }
  },
  head: () => ({
    ...buildSeoMeta({
      title: "Dashboard",
      description: "Manage your websites and generated Open Graph images.",
      path: "/dashboard",
    }),
    meta: [
      ...buildSeoMeta({
        title: "Dashboard",
        description: "Manage your websites and generated Open Graph images.",
        path: "/dashboard",
      }).meta,
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignedInDashboard,
});
