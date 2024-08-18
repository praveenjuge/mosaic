"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { forwardRef, useState } from "react";
import { toast } from "sonner";

interface SignupButtonProps {
  plan: { id: string; variantId: number };
  disabled?: boolean;
}

export const SignupButton = forwardRef<HTMLButtonElement, SignupButtonProps>(
  (props, ref) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    return (
      <Button
        ref={ref}
        className="w-full"
        disabled={loading || props.disabled}
        onClick={async () => {
          let checkoutUrl: string | undefined = "";
          try {
            setLoading(true);
            checkoutUrl = "TEST";
          } catch (error) {
            setLoading(false);
            toast("Error creating a checkout.", {
              description: `Please try again later. ${error}`,
            });
          } finally {
            setLoading(false);
          }
          router.push(checkoutUrl ?? "/");
        }}
      >
        Get Pro Plan {"-->"}
      </Button>
    );
  },
);

SignupButton.displayName = "SignupButton";
