import { UserButton } from "@clerk/tanstack-react-start";
import { dark } from "@clerk/ui/themes";
import { useTheme } from "next-themes";

export default function UserProfile() {
  const { resolvedTheme } = useTheme();

  return (
    <UserButton
      appearance={{
        theme: resolvedTheme === "dark" ? dark : undefined,
        elements: {
          userButtonPopoverFooter: "!hidden",
        },
      }}
      userProfileProps={{
        appearance: {
          theme: resolvedTheme === "dark" ? dark : undefined,
        },
      }}
    />
  );
}
