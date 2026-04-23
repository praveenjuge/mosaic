import DashboardPage from "@/components/dashboard/dashboard-page";
import HomeSignedOut from "@/components/home/homesignedout";
import { getChangelogEntries } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

export const Route = createFileRoute("/_public/")({
  loader: () => ({
    changelogEntries: getChangelogEntries(),
  }),
  head: () => {
    const seo = buildSeoMeta({
      title: "Simplify Your Open Graph Image Creation.",
      description: homeDescription,
      image: getOgImageUrl(""),
      path: "/",
    });

    return {
      ...seo,
    };
  },
  component: HomePage,
});

function HomePage() {
  const { changelogEntries } = Route.useLoaderData();
  const { auth } = Route.useRouteContext();
  const { isSignedIn } = useAuth();

  // Use client-side Clerk state as well — after sign-in the server-side
  // auth from beforeLoad may still reflect the pre-auth state because the
  // session cookie hasn't propagated to the server function yet.
  if (auth.isAuthenticated || isSignedIn) {
    return <DashboardPage />;
  }

  return <HomeSignedOut changelogEntries={changelogEntries} />;
}
