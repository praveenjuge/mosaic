import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SignupButton } from "./signup-button";

export interface PlanButtonProps {
  type: "free" | "pro" | "teams" | "enterprise";
}

async function checkUserActive() {
  const { userId } = auth();
  if (!userId) return false;

  const client = await createClient();
  const { data, error } = await client
    .from("subscription")
    .select("status")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user subscription", error);
    return false;
  }

  return data?.status === "active";
}

export async function PlanButton({ type }: PlanButtonProps) {
  const isActive = await checkUserActive();

  const commonButton = (text: string, disabled = false) => (
    <Button variant="outline" className="w-full" disabled={disabled}>
      {text}
    </Button>
  );

  const loadingButton = commonButton("Loading...", true);
  const getStartedButton = (
    <SignUpButton mode="modal">
      <Button className="w-full">Get Started →</Button>
    </SignUpButton>
  );

  const renderContent = () => {
    switch (type) {
      case "free":
        return isActive
          ? commonButton("You are on Pro Plan 🎉", true)
          : commonButton("You are on Free Plan", true);
      case "pro":
        return isActive ? (
          commonButton("You are on Pro Plan 🎉", true)
        ) : (
          <SignupButton plan={{ id: "321693", variantId: 468280 }} />
        );
      case "teams":
        return commonButton("Coming Soon", true);
      case "enterprise":
        return (
          <Link
            href="mailto:hello@praveenjuge.com"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Contact Sales
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ClerkLoading>{loadingButton}</ClerkLoading>
      <ClerkLoaded>
        <SignedOut>{getStartedButton}</SignedOut>
        <SignedIn>{renderContent()}</SignedIn>
      </ClerkLoaded>
    </>
  );
}
