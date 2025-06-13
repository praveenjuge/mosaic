import { Button, buttonVariants } from "@/components/ui/button";
import { getUserStats, getUserSubscriptionInfo } from "@/lib/database-helpers";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "@mynaui/icons-react";
import Link from "next/link";
import AddWebsiteModal from "./AddWebsiteModal";

export async function AddWebsite() {
  const { userId } = await auth();
  const [userStats, subscriptionInfo] = await Promise.all([
    getUserStats(),
    getUserSubscriptionInfo(userId),
  ]);
  const currentWebsiteCount = userStats?.total_websites || 0;
  const preventSubmission =
    currentWebsiteCount >= subscriptionInfo.plan_properties.websites_limit;

  return (
    <>
      <ClerkLoading>
        <Button size="sm" disabled>
          <Plus className="size-4" stroke={2} />
          Add Website
        </Button>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          {preventSubmission ? (
            <Link href="/settings" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-4" stroke={2} />
              Upgrade to Pro
            </Link>
          ) : (
            <AddWebsiteModal />
          )}
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal" withSignUp={true} oauthFlow="popup">
            <Button size="sm">
              <Plus className="size-4" stroke={2} />
              Add Website
            </Button>
          </SignInButton>
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
