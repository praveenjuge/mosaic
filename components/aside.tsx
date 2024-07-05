"use client";

import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/nextjs";
import {
  Cog,
  Copyright,
  FileText,
  Globe,
  Home,
  Lightning,
  ListCheck,
  ShootingStar,
  Support,
} from "@mynaui/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";

interface NavLinkProps {
  href: string;
  icon?: React.ComponentType<{ className?: string; stroke?: number }>;
  label: string;
}

function NavLink({ href, icon: Icon, label }: NavLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2",
        pathname === href ? "text-emerald-600 [&_svg]:text-emerald-600" : "",
      )}
    >
      {Icon && <Icon className="size-5 text-slate-500" stroke={2} />}
      <span>{label}</span>
    </Link>
  );
}

export default function Aside() {
  return (
    <aside className="flex h-screen max-h-screen min-h-screen w-56 min-w-56 flex-col justify-between gap-6 border-r-[0.5px] border-slate-300 bg-white p-4 font-medium">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Logo />
          <SignedIn>
            <div className="size-6 shrink-0 rounded-full bg-slate-200 [&_.cl-avatarBox]:size-6 [&_button]:size-6">
              <UserButton />
            </div>
          </SignedIn>
        </div>
        <nav className="flex flex-col gap-3">
          <NavLink href="/" icon={Home} label="Home" />
          <NavLink href="/websites" icon={Globe} label="Websites" />
          <NavLink href="/analytics" icon={Lightning} label="Analytics" />
          <NavLink
            href="/subscription"
            icon={ShootingStar}
            label="Subscription"
          />
          <NavLink href="/settings" icon={Cog} label="Settings" />
        </nav>
      </div>
      <nav className="flex flex-col gap-3">
        <NavLink href="/changelog" icon={ListCheck} label="Changelog" />
        <NavLink href="/resources" icon={FileText} label="Resources" />
        <NavLink href="/help" icon={Support} label="Help & Support" />
        <NavLink href="/legal" icon={Copyright} label="Privacy & Terms" />
      </nav>
    </aside>
  );
}
