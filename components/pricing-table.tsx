"use client";

import { PlanButton } from "@/app/settings/plan-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Check } from "lucide-react";
import { Suspense } from "react";
import { Button } from "./ui/button";

// Define plan features
const planFeatures: Record<"free" | "pro" | "pro-yearly", string[]> = {
  free: ["500 OG Images", "Unlimited Websites", "Community Forum Support"],
  pro: ["5,000 OG Images", "Unlimited Websites", "Priority Email Support"],
  "pro-yearly": [
    "Unlimited OG Images",
    "Unlimited Websites",
    "Priority Email Support",
  ],
};

// Plan card loading skeleton
function PlanCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex items-baseline">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="ml-1 h-4 w-8" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

// Individual plan card component
function PlanCard({
  productKey,
  product,
}: {
  productKey: string;
  product: {
    name: string;
    description: string | null;
    prices: Array<{ priceAmount: number | null; priceCurrency?: string }>;
  };
}) {
  const price = product.prices[0]?.priceAmount
    ? `$${(product.prices[0].priceAmount / 100).toFixed(0)}`
    : "$0";

  const isYearly = productKey === "premiumYearly";
  const planType = isYearly
    ? "pro-yearly"
    : productKey === "premiumMonthly"
      ? "pro"
      : "free";
  const badge = isYearly ? "Save $29/year" : null;
  const period = isYearly ? "/year" : "/month";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{product.name}</CardTitle>
          {productKey === "premiumMonthly" && (
            <Badge variant="secondary" className="text-xs">
              Popular
            </Badge>
          )}
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardDescription>{product.description ?? ""}</CardDescription>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {planFeatures[planType as keyof typeof planFeatures]?.map(
            (feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="text-primary size-4 stroke-2" />
                <span className="text-sm">{feature}</span>
              </li>
            ),
          )}
        </ul>
      </CardContent>
      <CardFooter>
        <Suspense
          fallback={
            <Button variant="outline" className="w-full" disabled>
              Loading...
            </Button>
          }
        >
          <PlanButton type={planType as "free" | "pro" | "pro-yearly"} />
        </Suspense>
      </CardFooter>
    </Card>
  );
}

// Pricing table content component
function PricingTableContent() {
  const products = useQuery(api.billing.getConfiguredProducts);

  if (!products) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PlanCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Always show free plan + configured products
  const freePlan = {
    name: "Free",
    description: "Perfect for Getting Started",
    prices: [{ priceAmount: 0 }],
  };

  const productEntries = Object.entries(products).filter(
    ([key]) => key === "premiumMonthly" || key === "premiumYearly",
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <PlanCard productKey="free" product={freePlan} />
      {productEntries.map(([key, product]) => (
        <Suspense key={key} fallback={<PlanCardSkeleton />}>
          <PlanCard productKey={key} product={product} />
        </Suspense>
      ))}
    </div>
  );
}

// Main pricing table component
export default function PricingTable() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <PricingTableContent />
    </Suspense>
  );
}
