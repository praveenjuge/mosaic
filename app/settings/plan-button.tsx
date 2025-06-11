import { Button } from "@/components/ui/button";
import { getUserSubscriptionInfo } from "@/lib/database-helpers";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
} from "@clerk/nextjs";

export interface PlanButtonProps {
  type: "free" | "pro" | "teams" | "pro-yearly";
}

export async function PlanButton({ type }: PlanButtonProps) {
  const subscriptionInfo = await getUserSubscriptionInfo();
  const isActive = subscriptionInfo.plan.toLowerCase() === "pro";

  const commonButton = (text: string, disabled = false) => (
    <Button variant="outline" className="w-full" disabled={disabled}>
      {text}
    </Button>
  );

  const loadingButton = commonButton("Loading...", true);
  const getStartedButton = (
    <SignUpButton mode="modal">
      <Button className="w-full">Get Started {"-->"}</Button>
    </SignUpButton>
  );

  const renderContent = () => {
    switch (type) {
      case "free":
        return commonButton(
          `You are on ${isActive ? "Pro" : "Free"} Plan ${
            isActive ? "🎉" : ""
          }`,
          true,
        );
      case "pro":
        return isActive
          ? (
            commonButton("You are on Pro Plan 🎉", true)
          )
          : (
            commonButton("Coming Soon", true)
          );
      case "teams":
        return commonButton("Coming Soon", true);
      case "pro-yearly":
        return commonButton("Coming Soon", true);
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
