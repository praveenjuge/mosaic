import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import AddWebsiteClient from "./AddWebsiteClient";

export async function AddWebsite() {
  const { userId, getToken } = await auth();

  let subscriptionInfo = {
    plan: "free",
    plan_properties: {
      websites_limit: 999999,
      images_limit: 500,
    },
    is_active: false,
  };

  if (userId) {
    const token = await getToken({ template: "convex" });
    subscriptionInfo = await fetchQuery(
      api.billing.getCurrentSubscription,
      {},
      token ? { token } : {},
    );
  }

  return (
    <AddWebsiteClient
      websitesLimit={subscriptionInfo.plan_properties.websites_limit}
    />
  );
}
