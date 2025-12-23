"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
} from "@clerk/nextjs";
import { CustomerPortalLink } from "@convex-dev/polar/react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";

export interface PlanButtonProps {
  type: "free" | "pro" | "pro-yearly";
}

const defaultSubscriptionInfo = {
  plan: "free",
  plan_properties: {
    images_limit: 500,
  },
  is_active: false,
};

export function PlanButton({ type }: PlanButtonProps) {
  const subscription = useQuery(api.billing.getCurrentSubscription);
  const products = useQuery(api.billing.getConfiguredProducts);
  const createCheckout = useAction(api.billing.createCheckoutLink);
  const [isloading, setIsLoading] = useState(false);

  // Get product ID from configured products
  const productKey = type === "pro" ? "premiumMonthly" : "premiumYearly";
  const productId = products?.[productKey]?.id;

  const { is_active: isActive, plan: currentPlan } =
    subscription ?? defaultSubscriptionInfo;

  const handleUpgrade = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const result = await createCheckout({
        productIds: [productId],
        successUrl: `${window.location.origin}/pricing`,
        origin: window.location.origin,
      });
      // Navigate to checkout URL
      if (result && typeof result === "object" && "url" in result) {
        window.location.href = result.url as string;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    if (type === "free") {
      const planName = isActive
        ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
        : "Free";
      return (
        <Button variant="outline" className="w-full" disabled>
          You are on {planName} Plan {isActive ? "🎉" : ""}
        </Button>
      );
    }

    if (isActive && currentPlan === type) {
      // User has the exact plan - show manage subscription
      return (
        <CustomerPortalLink polarApi={api.billing} className="w-full">
          <Button className="w-full">Manage Subscription 🎉</Button>
        </CustomerPortalLink>
      );
    }

    if (isActive) {
      // User has a different active plan
      const otherPlanName = type === "pro" ? "Pro Yearly" : "Pro";
      return (
        <Button variant="outline" className="w-full" disabled>
          You are on {otherPlanName} Plan 🎉
        </Button>
      );
    }

    // User doesn't have active subscription - show upgrade
    if (!productId) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Invalid plan
        </Button>
      );
    }

    const upgradeText =
      type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly";

    return (
      <Button className="w-full" onClick={handleUpgrade} disabled={isloading}>
        {isloading ? "Loading..." : upgradeText}
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
