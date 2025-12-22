import { getUserSubscriptionInfo } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  const subscriptionInfo = await getUserSubscriptionInfo(userId);

  return Response.json(subscriptionInfo, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
