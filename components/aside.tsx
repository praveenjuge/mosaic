"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/nextjs";
import {
  Config,
  Copyright,
  Earth,
  FileText,
  Home,
  Lightning,
  ListCheck,
  Menu,
  ShootingStar,
  Support,
} from "@mynaui/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Logo from "./logo";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/websites", icon: Earth, label: "Websites" },
  { href: "/analytics", icon: Lightning, label: "Analytics" },
  { href: "/subscription", icon: ShootingStar, label: "Subscription" },
  { href: "/settings", icon: Config, label: "Settings" },
];

const secondaryNavItems = [
  { href: "/changelog", icon: ListCheck, label: "Changelog" },
  { href: "/blog", icon: FileText, label: "Blog & Guides" },
  { href: "/help", icon: Support, label: "Help & Support" },
  { href: "/legal", icon: Copyright, label: "Privacy & Terms" },
];

const NavLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; stroke?: number }>;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 py-1",
        isActive && "font-semibold text-primary [&_svg]:text-primary",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-4 h-full w-1 select-none rounded-r-full bg-primary"
        />
      )}
      {Icon && (
        <Icon
          stroke={2}
          aria-hidden="true"
          className="size-[1.125rem] text-muted-foreground"
        />
      )}
      <span>{label}</span>
    </Link>
  );
};

const AsideContent = () => (
  <aside
    aria-label="Main navigation"
    className="relative flex h-screen max-h-screen min-h-screen w-56 min-w-56 flex-col gap-2 overflow-auto bg-primary-foreground p-4 font-medium md:justify-between md:border-r-[0.5px]"
  >
    <div className="flex flex-col gap-6">
      <div className="flex h-[18px] items-center justify-between">
        <Logo />
        <SignedIn>
          <div className="hidden size-6 shrink-0 rounded-full bg-muted-foreground md:block [&_.cl-avatarBox]:size-6 [&_button]:size-6">
            <UserButton />
          </div>
        </SignedIn>
      </div>
      <nav className="flex flex-col gap-1.5" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
    <nav className="flex flex-col gap-1.5" aria-label="Secondary navigation">
      {secondaryNavItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  </aside>
);

export default function Aside() {
  const memoizedAsideContent = useMemo(() => <AsideContent />, []);

  return (
    <>
      <div className="hidden md:block">{memoizedAsideContent}</div>
      <SignedIn>
        <div className="fixed right-4 top-4 z-10 size-8 shrink-0 rounded-full bg-muted-foreground md:hidden [&_.cl-avatarBox]:size-8 [&_button]:size-8">
          <UserButton />
        </div>
      </SignedIn>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Toggle navigation menu"
            className="fixed left-3 top-3 z-10 shrink-0 rounded-full md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-auto p-0">
          {memoizedAsideContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
