"use client";

import { Button } from "@/components/ui/button";
import { UserSubscriptionInfo } from "@/lib/types";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
  useAuth,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export interface PlanButtonProps {
  type: "free" | "pro" | "pro-yearly";
}

const defaultSubscriptionInfo: UserSubscriptionInfo = {
  plan: "free",
  plan_properties: {
    websites_limit: 1,
    images_limit: 500,
  },
  is_active: false,
};

export function PlanButton({ type }: PlanButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<UserSubscriptionInfo | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let isMounted = true;

    const fetchSubscription = async () => {
      setIsFetching(true);
      try {
        const response = await fetch("/api/subscription/info", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch subscription info");
        }
        const data = (await response.json()) as UserSubscriptionInfo;
        if (isMounted) {
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error("Error fetching subscription info:", error);
        if (isMounted) {
          setSubscriptionInfo(defaultSubscriptionInfo);
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchSubscription();
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn]);

  const { is_active: isActive, plan: currentPlan } =
    subscriptionInfo ?? defaultSubscriptionInfo;

  // Helper to create checkout URL
  const checkoutUrl = (plan: PlanButtonProps["type"]) =>
    isSignedIn ? `/api/checkout/create?plan=${plan}` : "#";

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
    const upgradeText =
      type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly";
    return (
      <Button className="w-full" asChild>
        <a href={checkoutUrl(type)}>{upgradeText}</a>
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
        <SignedIn>
          <Button
            variant="outline"
            className={`w-full ${!isFetching ? "hidden" : ""}`}
            disabled
          >
            Loading...
          </Button>
          {!isFetching && renderButton()}
        </SignedIn>
      </ClerkLoaded>
    </>
  );
}
