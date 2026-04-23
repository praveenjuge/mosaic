import { UserButton } from "@clerk/tanstack-react-start";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function UserProfile() {
  const { resolvedTheme } = useTheme();

  return (
    <UserButton
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        elements: {
          userButtonPopoverFooter: "!hidden",
        },
      }}
      userProfileProps={{
        appearance: {
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
        },
      }}
    />
  );
}
