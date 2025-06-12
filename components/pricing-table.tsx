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

export default function PricingTable() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan, index) => (
        <Card key={index} className="relative">
          {plan.badge && (
            <Badge className="absolute top-3 right-3">{plan.badge}</Badge>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{plan.title}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4 flex items-center gap-2">
              <div className="text-4xl font-bold">{plan.price}</div>
              {plan.price !== "$0" && (
                <div className="text-muted-foreground text-sm">
                  {plan.type === "pro-yearly" ? "per year" : "per month"}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center">
                  <Check className="text-primary mr-2 h-4 w-4" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <PlanButton
                type={plan.type as "free" | "pro" | "teams" | "pro-yearly"}
              />
            </Suspense>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
