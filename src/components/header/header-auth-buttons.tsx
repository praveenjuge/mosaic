import { SignInLink, SignUpLink } from "@/components/auth/auth-links";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingSkeleton() {
  return <Skeleton className="size-8 rounded-full" />;
}

export function SignedOutButtons() {
  return (
    <div className="flex items-center gap-1.5">
      <SignInLink variant="ghost">Log In</SignInLink>
      <SignUpLink>Get started</SignUpLink>
    </div>
  );
}
