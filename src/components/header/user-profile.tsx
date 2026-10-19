import { useClerkAppearance } from "@/components/auth/use-clerk-appearance";
import { UserButton } from "@clerk/tanstack-react-start";

export default function UserProfile() {
  const appearance = useClerkAppearance();

  return (
    <UserButton
      appearance={{
        ...appearance,
        elements: {
          userButtonPopoverFooter: "!hidden",
        },
      }}
      userProfileProps={{ appearance }}
    />
  );
}
