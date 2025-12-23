"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Suspense } from "react";
import UserProfile from "./user-profile";

function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

function SignedOutButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal" withSignUp={true} oauthFlow="popup">
        <Button variant="outline" size="sm">
          Log In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal" oauthFlow="popup">
        <Button size="sm">Sign Up</Button>
      </SignUpButton>
    </div>
  );
}

function SignedInNav() {
  return (
    <nav className="flex items-center gap-2 md:gap-4">
      <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
        <UserProfile />
      </Suspense>
    </nav>
  );
}

export default function HeaderAuth() {
  return (
    <>
      <AuthLoading>
        <AuthLoadingSkeleton />
      </AuthLoading>

      <Unauthenticated>
        <Suspense fallback={<AuthLoadingSkeleton />}>
          <SignedOutButtons />
        </Suspense>
      </Unauthenticated>

      <Authenticated>
        <Suspense fallback={<AuthLoadingSkeleton />}>
          <SignedInNav />
        </Suspense>
      </Authenticated>
    </>
  );
}
