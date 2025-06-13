import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { Config } from "@mynaui/icons-react";
import Link from "next/link";
import { Suspense } from "react";
import Logo from "../logo";
import UserProfile from "./user-profile";

// Separate authentication loading component for better Suspense boundaries
function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

// Signed out state component
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

// Signed in navigation component
function SignedInNav() {
  return (
    <nav className="flex items-center gap-2 md:gap-4">
      <Link
        href="/settings"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <Config className="size-4 stroke-2" />
        <span className="hidden sm:inline">Settings</span>
      </Link>
      <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
        <UserProfile />
      </Suspense>
    </nav>
  );
}

// Authentication wrapper component with separate Suspense boundaries
function AuthenticationSection() {
  return (
    <>
      <ClerkLoading>
        <AuthLoadingSkeleton />
      </ClerkLoading>

      <ClerkLoaded>
        <SignedOut>
          <Suspense fallback={<AuthLoadingSkeleton />}>
            <SignedOutButtons />
          </Suspense>
        </SignedOut>

        <SignedIn>
          <Suspense fallback={<AuthLoadingSkeleton />}>
            <SignedInNav />
          </Suspense>
        </SignedIn>
      </ClerkLoaded>
    </>
  );
}

const Header = () => {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b-[0.5px] backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4">
        <Suspense fallback={<div className="h-8 w-32" />}>
          <Logo />
        </Suspense>

        {/* Right side - Navigation and Auth */}
        <div className="flex items-center gap-2 md:gap-4">
          <Suspense fallback={<AuthLoadingSkeleton />}>
            <AuthenticationSection />
          </Suspense>
        </div>
      </div>
    </header>
  );
};

export default Header;
