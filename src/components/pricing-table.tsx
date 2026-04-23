import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authenticatedHomePath } from "@/lib/clerk-auth";
import { PLANS, PRICING_PLANS, type PlanType } from "@/lib/pricing";
import { SignUpButton } from "@clerk/tanstack-react-start";
import { Check } from "lucide-react";

interface PlanButtonProps {
  type: PlanType;
}

function PlanButton({ type }: PlanButtonProps) {
  return (
    <SignUpButton
      fallbackRedirectUrl={authenticatedHomePath}
      forceRedirectUrl={authenticatedHomePath}
    >
      <Button className="w-full">
        {type === "free" ? "Start Free" : "Sign Up"}
      </Button>
    </SignUpButton>
  );
}

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: PlanType;
  planInfo: (typeof PLANS)[PlanType];
}

function PlanCard({
  name,
  description,
  price,
  period,
  badge,
  planType,
  planInfo,
}: PlanCardProps) {
  const features = [
    planInfo.images_display,
    planInfo.websites,
    planInfo.support,
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="text-primary size-4 stroke-2" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <PlanButton type={planType} />
      </CardFooter>
    </Card>
  );
}

export default function PricingTable() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <PlanCard
          key={plan.planType}
          name={plan.name}
          description={plan.description}
          price={plan.price}
          period={plan.period}
          badge={plan.badge}
          planType={plan.planType}
          planInfo={PLANS[plan.planType]}
        />
      ))}
    </div>
  );
}
