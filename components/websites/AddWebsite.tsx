import { getUserSubscriptionInfo } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import AddWebsiteClient from "./AddWebsiteClient";

export async function AddWebsite() {
  const { userId } = await auth();
  const subscriptionInfo = await getUserSubscriptionInfo(userId);

  return (
    <AddWebsiteClient
      websitesLimit={subscriptionInfo.plan_properties.websites_limit}
    />
  );
}
