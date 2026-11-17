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
function AuthLink({
  to,
  children,
  ...props
}: AuthLinkProps & { to: "/sign-in/$" | "/sign-up/$" }) {
  return (
    <Button asChild {...props}>
      <Link
        to={to}
        params={{ _splat: "" }}
        search={{ redirect_url: undefined }}
      >
        {children}
      </Link>
    </Button>
  );
}

export function SignInLink(props: AuthLinkProps) {
  return <AuthLink to="/sign-in/$" {...props} />;
}

export function SignUpLink(props: AuthLinkProps) {
  return <AuthLink to="/sign-up/$" {...props} />;
}
