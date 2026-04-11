import DashboardPage from "@/components/dashboard/dashboard-page";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_dashboard/dashboard")({
  component: DashboardPage,
});
