"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import PricingTable from "@/components/pricing-table";
import { CreditCard, LifeBuoy, Monitor, Moon, Sun } from "lucide-react";
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
      <UserButton.UserProfilePage
        label="Plan & Billing"
        labelIcon={<CreditCard className="size-4" />}
        url="plan"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Plan & Billing</h2>
            <p className="text-muted-foreground text-sm">
              Manage your subscription and billing preferences.
            </p>
          </div>
          <PricingTable />
        </div>
      </UserButton.UserProfilePage>
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
