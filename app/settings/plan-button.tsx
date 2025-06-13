import { Button } from "@/components/ui/button";
import { getUserSubscriptionInfo } from "@/lib/database-helpers";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export interface PlanButtonProps {
  type: "free" | "pro" | "pro-yearly";
}

const proProductId = process.env.POLAR_PRO_PRODUCT_ID!;
const proYearlyProductId = process.env.POLAR_PRO_YEARLY_PRODUCT_ID!;

export async function PlanButton({ type }: PlanButtonProps) {
  const subscriptionInfo = await getUserSubscriptionInfo();
  const { userId } = await auth();
  const { is_active: isActive, plan: currentPlan } = subscriptionInfo;

  // Helper to create checkout URL
  const checkoutUrl = (productId: string) =>
    userId
      ? `/api/checkout/create?product_id=${productId}&customer_external_id=${userId}`
      : "#";

  // Helper to capitalize plan name
  const capitalizePlan = (plan: string) =>
    plan.charAt(0).toUpperCase() + plan.slice(1);

  // Render button based on type and subscription status
  const renderButton = () => {
    if (type === "free") {
      const planName = isActive ? capitalizePlan(currentPlan) : "Free";
      return (
        <Button variant="outline" className="w-full" disabled>
          You are on {planName} Plan {isActive ? "🎉" : ""}
        </Button>
      );
    }

    if (isActive && currentPlan === type) {
      // User has the exact plan - show manage subscription
      return (
        <Button className="w-full" asChild>
          <a
            href="/api/customer-portal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage Subscription 🎉
          </a>
        </Button>
      );
    }

    if (isActive) {
      // User has a different active plan - show status
      const otherPlanName = type === "pro" ? "Pro Yearly" : "Pro";
      return (
        <Button variant="outline" className="w-full" disabled>
          You are on {otherPlanName} Plan 🎉
        </Button>
      );
    }

    // User doesn't have active subscription - show upgrade
    const productId = type === "pro" ? proProductId : proYearlyProductId;
    const upgradeText =
      type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly";
    return (
      <Button className="w-full" asChild>
        <a href={checkoutUrl(productId)}>{upgradeText}</a>
      </Button>
    );
  };

  return (
    <>
      <ClerkLoading>
        <Button variant="outline" className="w-full" disabled>
          Loading...
        </Button>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignUpButton mode="modal" oauthFlow="popup">
            <Button className="w-full">
              {type === "free" ? "Start Free" : "Sign Up"}
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>{renderButton()}</SignedIn>
      </ClerkLoaded>
    </>
  );
}
