"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { DashboardStats } from "@/convex/stats";
import { authenticatedHomePath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
import { CustomerPortalLink } from "@convex-dev/polar/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

type PlanType = "free" | "pro" | "pro-yearly";

type CreateCheckoutLink = (args: {
  origin: string;
  productIds: string[];
  successUrl: string;
  subscriptionId?: string;
}) => Promise<{ url: string }>;

function ImagesStatCard({
  countDisplay,
  limitDisplay,
}: {
  countDisplay: string;
  limitDisplay: string;
}) {
  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>
          {countDisplay}/{limitDisplay}
        </CardTitle>
        <CardDescription>OG Images</CardDescription>
      </CardHeader>
    </Card>
  );
}

function UpgradeButton({
  createCheckout,
  dashboardStats,
  label,
  productId,
  type,
}: {
  createCheckout: CreateCheckoutLink;
  dashboardStats: DashboardStats;
  label?: string;
  productId: string;
  type: PlanType;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isActive = dashboardStats.is_active;
  const currentPlan = dashboardStats.plan;

  function handleUpgrade() {
    if (!productId) {
      return;
    }

    setIsLoading(true);
    createCheckout({
      productIds: [productId],
      successUrl: `${window.location.origin}${authenticatedHomePath}`,
      origin: window.location.origin,
    })
      .then((result) => {
        window.location.href = result.url;
      })
      .catch((error) => {
        console.error("Checkout error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  if (type === "free") {
    return (
      <Button variant="outline" size="sm" disabled>
        You are on {dashboardStats.plan_display_name} {isActive ? "🎉" : ""}
      </Button>
    );
  }

  if (isActive && currentPlan === type) {
    return (
      <CustomerPortalLink polarApi={api.billing}>
        <Button size="sm">Manage Subscription 🎉</Button>
      </CustomerPortalLink>
    );
  }

  if (isActive) {
    return (
      <Button variant="outline" size="sm" disabled>
        You are on {dashboardStats.plan_display_name} Plan 🎉
      </Button>
    );
  }

  if (!productId) {
    return (
      <Button variant="outline" size="sm" disabled>
        Invalid plan
      </Button>
    );
  }

  const buttonText =
    label || (type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly");

  return (
    <Button size="sm" onClick={handleUpgrade} disabled={isLoading}>
      {isLoading ? "Loading..." : buttonText}
    </Button>
  );
}

export function DashboardOverview({
  createCheckout,
  dashboardStats,
}: {
  createCheckout: CreateCheckoutLink;
  dashboardStats: DashboardStats;
}) {
  return (
    <div className="flex flex-col gap-10">
      {dashboardStats.plan === "free" && dashboardStats.has_exceeded_limit ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Free Plan Limit Exceeded</AlertTitle>
          <AlertDescription>
            You've reached the limit of {dashboardStats.images_limit} OG images.
            Upgrade to continue generating images.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <CardHeader className="p-0">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="px-4">
              <CardTitle>{dashboardStats.total_websites_display}</CardTitle>
              <CardDescription>Websites</CardDescription>
            </CardHeader>
          </Card>
          <ImagesStatCard
            countDisplay={dashboardStats.total_images_display}
            limitDisplay={dashboardStats.images_limit_display}
          />
          <Card className="md:col-span-2">
            <CardHeader className="items-center px-4">
              <CardTitle>{dashboardStats.plan_display_name}</CardTitle>
              <CardDescription>
                {dashboardStats.is_active
                  ? "Your plan is active"
                  : "Upgrade to unlock more features"}
              </CardDescription>
              <CardAction>
                {dashboardStats.is_active ? (
                  <UpgradeButton
                    type={dashboardStats.plan}
                    productId={
                      dashboardStats.plan === "pro-yearly"
                        ? publicEnv.polarPremiumYearlyProductId
                        : publicEnv.polarPremiumMonthlyProductId
                    }
                    dashboardStats={dashboardStats}
                    createCheckout={createCheckout}
                  />
                ) : (
                  <div className="flex gap-2">
                    <UpgradeButton
                      type="pro"
                      label="Monthly $19"
                      productId={publicEnv.polarPremiumMonthlyProductId}
                      dashboardStats={dashboardStats}
                      createCheckout={createCheckout}
                    />
                    <UpgradeButton
                      type="pro-yearly"
                      label="Yearly $199"
                      productId={publicEnv.polarPremiumYearlyProductId}
                      dashboardStats={dashboardStats}
                      createCheckout={createCheckout}
                    />
                  </div>
                )}
              </CardAction>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
