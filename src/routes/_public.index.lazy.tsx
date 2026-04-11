import HomeSignedOut from "@/components/home/homesignedout";
import { changelogEntries } from "@/generated/content";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  return <HomeSignedOut changelogEntries={changelogEntries} />;
}
