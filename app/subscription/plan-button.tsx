import { Button, buttonVariants } from "@/components/ui/button";
import { UserMetaData } from "@/lib/types";
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
  type: "free" | "pro" | "teams" | "pro-plus";
}

export async function PlanButton({ type }: PlanButtonProps) {
  const { userId, sessionClaims } = auth();
  const user = await currentUser();
  const plan = (sessionClaims?.public_metadata as UserMetaData)?.plan;
  const isActive = plan?.toLowerCase() === "pro";

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
        return commonButton(
          `You are on ${isActive ? "Pro" : "Free"} Plan ${isActive ? "🎉" : ""}`,
          true,
        );
      case "pro":
        return isActive ? (
          commonButton("You are on Pro Plan 🎉", true)
        ) : (
          <Link
            href={`https://mosaicimg.gumroad.com/l/pro?email=${user?.emailAddresses[0].emailAddress}&clerk_user_id=${userId}&wanted=true`}
            className={cn(buttonVariants(), "w-full")}
            target="_blank"
          >
            Get Pro Plan {"-->"}
          </Link>
        );
      case "teams":
        return commonButton("Coming Soon", true);
      case "pro-plus":
        return (
          <Link
            href="mailto:hello@praveenjuge.com"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Contact Us
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
