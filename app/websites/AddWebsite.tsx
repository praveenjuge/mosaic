import { Button, buttonVariants } from "@/components/ui/button";
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

interface MetaData {
  websites_used?: number;
  websites_limit?: number;
}

export async function AddWebsite() {
  const metaData = auth()?.sessionClaims?.public_metadata as MetaData;
  const preventSubmission =
    (metaData?.websites_used ?? 0) > (metaData?.websites_limit ?? Infinity);

  return (
    <>
      <ClerkLoading>
        <Button size="sm" disabled>
          <Plus className="mr-1 size-4" stroke={2} />
          Add Websites
        </Button>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          {preventSubmission ? (
            <Link
              href="/subscription"
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="mr-1 size-4" stroke={2} />
              Upgrade to Pro
            </Link>
          ) : (
            <AddWebsiteModal />
          )}
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="sm">
              <Plus className="mr-1 size-4" stroke={2} />
              Add Website
            </Button>
          </SignInButton>
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
