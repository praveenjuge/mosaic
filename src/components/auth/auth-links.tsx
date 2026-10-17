import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

type AuthLinkProps = Pick<
  ComponentProps<typeof Button>,
  "variant" | "size" | "className"
> & { children: ReactNode };

/**
 * Plain links to the sign-in and sign-up pages. Clerk's `SignInButton` and
 * `SignUpButton` only navigate there too, but they need Clerk's scripts, which
 * signed-out pages don't load (see `ClerkShell`). Both pages send the user
 * home after signing in.
 */
export function SignInLink({ children, ...props }: AuthLinkProps) {
  return (
    <Button asChild {...props}>
      <Link
        to="/sign-in/$"
        params={{ _splat: "" }}
        search={{ redirect_url: undefined }}
      >
        {children}
      </Link>
    </Button>
  );
}

export function SignUpLink({ children, ...props }: AuthLinkProps) {
  return (
    <Button asChild {...props}>
      <Link
        to="/sign-up/$"
        params={{ _splat: "" }}
        search={{ redirect_url: undefined }}
      >
        {children}
      </Link>
    </Button>
  );
}
