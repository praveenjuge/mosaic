"use client";

import { Button } from "@/components/ui/button";
import { getCheckoutURL } from "@/lib/lemon";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useState } from "react";
import { toast } from "sonner";

interface SignupButtonProps {
  embed?: boolean;
  plan: { id: string; variantId: number };
  currentPlan?: { id: string };
  isChangingPlans?: boolean;
  disabled?: boolean;
}

export const SignupButton = forwardRef<HTMLButtonElement, SignupButtonProps>(
  (props, ref) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const {
      embed = true,
      plan,
      currentPlan,
      isChangingPlans = false,
      ...otherProps
    } = props;

    const isCurrent = plan.id === currentPlan?.id;

    // eslint-disable-next-line no-nested-ternary -- allow
    const label = isCurrent
      ? "Your plan"
      : isChangingPlans
        ? "Switch to this plan"
        : "Sign up";

    // Make sure Lemon.js is loaded
    useEffect(() => {
      if (typeof window !== "undefined" && "createLemonSqueezy" in window) {
        (window as any).createLemonSqueezy();
      }
    }, []);

    const changePlan = async (currentPlanId: string, newPlanId: string) => {
      // Implement the changePlan function here
      console.log(`Changing plan from ${currentPlanId} to ${newPlanId}`);
      // Add your plan changing logic here
    };

    return (
      <Button
        ref={ref}
        disabled={loading || isCurrent || props.disabled}
        onClick={async () => {
          // If changing plans, call server action.
          if (isChangingPlans) {
            if (!currentPlan?.id) {
              throw new Error("Current plan not found.");
            }

            if (!plan.id) {
              throw new Error("New plan not found.");
            }

            setLoading(true);
            await changePlan(currentPlan.id, plan.id);
            setLoading(false);

            return;
          }

          // Otherwise, create a checkout and open the Lemon.js modal.
          let checkoutUrl: string | undefined = "";
          try {
            setLoading(true);
            checkoutUrl = await getCheckoutURL(plan.variantId, embed);
          } catch (error) {
            setLoading(false);
            toast("Error creating a checkout.", {
              description:
                "Please check the server console for more information.",
            });
          } finally {
            embed && setLoading(false);
          }

          if (embed && checkoutUrl) {
            (window as any).LemonSqueezy.Url.Open(checkoutUrl);
          } else {
            router.push(checkoutUrl ?? "/");
          }
        }}
        {...otherProps}
      >
        {label}
      </Button>
    );
  },
);

SignupButton.displayName = "SignupButton";
