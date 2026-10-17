import {
  ClerkLoaded,
  ClerkLoading,
  useAuth,
} from "@clerk/tanstack-react-start";
import { AuthLoadingSkeleton, SignedOutButtons } from "./header-auth-buttons";
import UserProfile from "./user-profile";

/** The header's account menu. Renders inside `ClerkShell`. */
export default function HeaderSignedIn() {
  const { userId } = useAuth();

  return (
    <>
      <ClerkLoading>
        <AuthLoadingSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        {userId ? (
          <nav className="flex items-center gap-2 md:gap-4">
            <UserProfile />
          </nav>
        ) : (
          <SignedOutButtons />
        )}
      </ClerkLoaded>
    </>
  );
}
