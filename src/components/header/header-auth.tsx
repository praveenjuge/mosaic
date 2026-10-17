import { headerSignedIn } from "@/lib/clerk-chunks";
import { useRouteContext } from "@tanstack/react-router";
import { Suspense } from "react";
import { AuthLoadingSkeleton, SignedOutButtons } from "./header-auth-buttons";

export default function HeaderAuth() {
  const { auth } = useRouteContext({ from: "__root__" });

  // Signed-out pages don't load Clerk, so they get plain links.
  if (!auth.userId) return <SignedOutButtons />;

  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <headerSignedIn.Component />
    </Suspense>
  );
}
