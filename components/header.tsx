import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Config } from "@mynaui/icons-react";
import Link from "next/link";
import { Suspense } from "react";
import Logo from "./logo";

const Header = () => {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b-[0.5px] backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Right side - Navigation and Auth */}
        <div className="flex items-center gap-2 md:gap-4">
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="size-8 rounded-full" />
              </div>
            }
          >
            <ClerkLoading>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="size-8 rounded-full" />
              </div>
            </ClerkLoading>

            <ClerkLoaded>
              <SignedOut>
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm">
                      Log In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">Sign Up</Button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <nav className="flex items-center gap-2 md:gap-4">
                  <Link
                    href="/settings"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Config className="size-4 stroke-2" />
                    <span className="hidden sm:inline">Settings</span>
                  </Link>
                  <UserButton />
                </nav>
              </SignedIn>
            </ClerkLoaded>
          </Suspense>
        </div>
      </div>
    </header>
  );
};

export default Header;
