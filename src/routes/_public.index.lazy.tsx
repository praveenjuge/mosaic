import HomeSignedOut from "@/components/home/homesignedout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  const { changelogEntries } = Route.useLoaderData();

  return <HomeSignedOut changelogEntries={changelogEntries} />;
}
