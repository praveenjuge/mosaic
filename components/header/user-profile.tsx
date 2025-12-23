"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { LifeBuoy, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function UserProfile() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const currentTheme = theme ?? "system";
  const nextTheme =
    currentTheme === "system"
      ? "light"
      : currentTheme === "light"
        ? "dark"
        : "system";
  const ThemeIcon =
    currentTheme === "light"
      ? Sun
      : currentTheme === "dark"
        ? Moon
        : Monitor;

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
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label={`Theme: ${currentTheme[0]?.toUpperCase()}${currentTheme.slice(1)}`}
          labelIcon={<ThemeIcon className="size-4" />}
          onClick={() => setTheme(nextTheme)}
        />
        <UserButton.Action
          label="Contact support"
          labelIcon={<LifeBuoy className="size-4" />}
          onClick={() => {
            window.location.href = "mailto:hello@praveenjuge.com";
          }}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
