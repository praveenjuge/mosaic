import { SignInLink, SignUpLink } from "@/components/auth/auth-links";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

export function SignedOutButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignInLink variant="outline" size="sm">
        Log In
      </SignInLink>
      <SignUpLink size="sm">Sign Up</SignUpLink>
    </div>
  );
}
