"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/tanstack-react-start";
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
      <SignInButton
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      >
        <Button variant="outline" size="sm">
          Log In
        </Button>
      </SignInButton>
      <SignUpButton
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      >
        <Button size="sm">Sign Up</Button>
      </SignUpButton>
    </div>
  );
}

function SignedInNav() {
  return (
    <nav className="flex items-center gap-2 md:gap-4">
      <UserProfile />
    </nav>
  );
}

export default function HeaderAuth() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <>
      <ClerkLoading>
        <AuthLoadingSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        {userId ? <SignedInNav /> : <SignedOutButtons />}
      </ClerkLoaded>
    </>
  );
}
