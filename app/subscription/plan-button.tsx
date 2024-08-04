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
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export interface PlanButtonProps {
  type: "free" | "pro" | "teams" | "enterprise";
}

async function checkUserActive(userId: string) {
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

  // return data?.status === "active";
  return false;
}

export async function PlanButton({ type }: PlanButtonProps) {
  const { userId } = auth();
  const user = await currentUser();
  const isActive = await checkUserActive(userId || "");

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
          <>
            {/* <SignupButton plan={{ id: "321693", variantId: 468280 }} /> */}
            <Link
              href={`https://mosaicimg.gumroad.com/l/pro?email=${
                user?.emailAddresses[0].emailAddress
              }&user_id=${userId}&wanted=true`}
              className={cn(buttonVariants(), "w-full")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Pro Plan {"-->"}
            </Link>
          </>
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
