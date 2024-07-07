"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/nextjs";
import {
  Config,
  Copyright,
  FileText,
  Globe,
  Home,
  Lightning,
  ListCheck,
  Menu,
  ShootingStar,
  Support,
} from "@mynaui/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";

const NavLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon?: React.ComponentType<{ className?: string; stroke?: number }>;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 py-1",
        isActive && "text-emerald-600 [&_svg]:text-emerald-600",
      )}
    >
      {isActive && (
        <span className="absolute -left-4 h-full w-1 rounded-r-full bg-emerald-600"></span>
      )}
      {Icon && <Icon className="size-5 text-slate-500" stroke={2} />}
      <span>{label}</span>
    </Link>
  );
};

const AsideContent = () => (
  <aside className="relative flex h-screen max-h-screen min-h-screen w-56 min-w-56 flex-col justify-between gap-2 overflow-auto border-r-[0.5px] border-slate-300 bg-white p-4 font-medium">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Logo />
        <SignedIn>
          <div className="size-6 shrink-0 rounded-full bg-slate-200 [&_.cl-avatarBox]:size-6 [&_button]:size-6">
            <UserButton />
          </div>
        </SignedIn>
      </div>
      <nav className="flex flex-col gap-2">
        <NavLink href="/" icon={Home} label="Home" />
        <NavLink href="/websites" icon={Globe} label="Websites" />
        <NavLink href="/analytics" icon={Lightning} label="Analytics" />
        <NavLink
          href="/subscription"
          icon={ShootingStar}
          label="Subscription"
        />
        <NavLink href="/settings" icon={Config} label="Settings" />
      </nav>
    </div>
    <nav className="flex flex-col gap-2">
      <NavLink href="/changelog" icon={ListCheck} label="Changelog" />
      <NavLink href="/resources" icon={FileText} label="Resources" />
      <NavLink href="/help" icon={Support} label="Help & Support" />
      <NavLink href="/legal" icon={Copyright} label="Privacy & Terms" />
    </nav>
  </aside>
);

export default function Aside() {
  return (
    <>
      <div className="hidden md:block">
        <AsideContent />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="fixed left-3 top-3 shrink-0 rounded-full md:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-auto p-0">
          <AsideContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
