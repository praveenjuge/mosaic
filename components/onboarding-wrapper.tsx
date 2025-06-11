import { OnboardingCard } from "@/components/onboarding-card";
import { getUserUsageInfo } from "@/lib/database-helpers";
import { auth } from "@clerk/nextjs/server";

export async function OnboardingWrapper() {
  const { userId } = await auth();

  if (!userId) {
    return <OnboardingCard usageData={null} />;
  }

  try {
    const usageInfo = await getUserUsageInfo();

    // Transform to the format expected by OnboardingCard
    const usageData = {
      images_used: usageInfo.images_used,
      websites_used: usageInfo.websites_used,
    };

    return <OnboardingCard usageData={usageData} />;
  } catch (error) {
    console.error("Error fetching usage data for onboarding:", error);
    // Return with null data as fallback
    return <OnboardingCard usageData={null} />;
  }
}
