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
import { Check } from "@mynaui/icons-react";
import { Suspense } from "react";
import { Button } from "./ui/button";

const plans = [
  {
    title: "Free",
    description: "For Trying Out",
    price: "$0",
    features: ["500 OG Images", "1 Website", "No Support"],
    type: "free",
  },
  {
    title: "Pro",
    description: "For Individual Use",
    price: "$19",
    features: [
      "5000 OG Images",
      "Unlimited Websites",
      "Priority Email Support",
    ],
    type: "pro",
  },
  {
    title: "Pro Yearly",
    description: "For Larger Websites",
    price: "$199",
    features: [
      "Unlimited OG Images",
      "Unlimited Websites",
      "Priority Email Support",
    ],
    type: "pro-yearly",
    badge: "Best Value - Save $29",
  },
];

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
function PlanCard({ plan }: { plan: (typeof plans)[0] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.title}</CardTitle>
          {plan.type === "pro" && (
            <Badge variant="secondary" className="text-xs">
              Popular
            </Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground ml-1">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="text-primary size-4 stroke-2" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
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
          <PlanButton type={plan.type as "free" | "pro" | "pro-yearly"} />
        </Suspense>
      </CardFooter>
    </Card>
  );
}

// Pricing table content component
function PricingTableContent() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Suspense key={plan.type} fallback={<PlanCardSkeleton />}>
          <PlanCard plan={plan} />
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
