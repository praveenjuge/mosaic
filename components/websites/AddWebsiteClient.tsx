"use client";

import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import AddWebsiteModal from "./AddWebsiteModal";

export default function AddWebsiteClient({
  websitesLimit,
}: {
  websitesLimit: number;
}) {
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
          <Link href="/settings" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-4" strokeWidth={2} />
            Upgrade to Pro
          </Link>
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
