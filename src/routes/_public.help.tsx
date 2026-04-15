import { getGuideLinks, getHelpCategories } from "@/lib/content";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help")({
  loader: () => ({
    guides: getGuideLinks(),
    helpCategories: getHelpCategories(),
  }),
  component: Outlet,
});
