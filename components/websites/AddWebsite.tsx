import { Button, buttonVariants } from "@/components/ui/button";
import { getUserUsageInfo } from "@/lib/db";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { Plus } from "@mynaui/icons-react";
import Link from "next/link";
import AddWebsiteModal from "./AddWebsiteModal";

export async function AddWebsite() {
  const usageInfo = await getUserUsageInfo();
  const preventSubmission = usageInfo.websites_used >= usageInfo.websites_limit;

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
          {preventSubmission
            ? (
              <Link
                href="/settings"
                className={buttonVariants({ size: "sm" })}
              >
                <Plus className="size-4" stroke={2} />
                Upgrade to Pro
              </Link>
            )
            : <AddWebsiteModal />}
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
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
