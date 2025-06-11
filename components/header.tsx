import { Button } from "@/components/ui/button";
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
import { Config, Earth } from "@mynaui/icons-react";
import Link from "next/link";
import { Suspense } from "react";
import Logo from "./logo";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b-[0.5px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 md:px-8">
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
                <Skeleton className="h-8 w-16" />
                <Skeleton className="size-8 rounded-full" />
              </div>
            }
          >
            <ClerkLoading>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
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
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <nav className="flex items-center gap-2 md:gap-4">
                  <Link
                    href="/websites"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Earth className="size-4" />
                    <span className="hidden sm:inline">Websites</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Config className="size-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </Link>
                  <div className="ml-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "size-8",
                          userButtonBox: "size-8",
                        },
                      }}
                    />
                  </div>
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
