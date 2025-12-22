"use client";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SignInButton, useClerk } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import AddWebsiteModal from "./AddWebsiteModal";

export default function AddWebsiteClient({
  websitesLimit,
}: {
  websitesLimit: number;
}) {
  const { openUserProfile } = useClerk();
  const websiteCount = useQuery(api.sites.countForUser);
  const isLimitLoading = websiteCount === undefined;
  const preventSubmission =
    websiteCount !== undefined && websiteCount >= websitesLimit;

  return (
    <>
      <AuthLoading>
        <Button size="sm" disabled>
          <Plus className="size-4" strokeWidth={2} />
          Add Website
        </Button>
      </AuthLoading>

      <Authenticated>
        {isLimitLoading ? (
          <Button size="sm" disabled>
            <Plus className="size-4" strokeWidth={2} />
            Add Website
          </Button>
        ) : preventSubmission ? (
          <Button
            size="sm"
            onClick={() => openUserProfile()}
          >
            <Plus className="size-4" strokeWidth={2} />
            Upgrade to Pro
          </Button>
        ) : (
          <AddWebsiteModal />
        )}
      </Authenticated>

      <Unauthenticated>
        <SignInButton mode="modal" withSignUp={true} oauthFlow="popup">
          <Button size="sm">
            <Plus className="size-4" strokeWidth={2} />
            Add Website
          </Button>
        </SignInButton>
      </Unauthenticated>
    </>
  );
}
