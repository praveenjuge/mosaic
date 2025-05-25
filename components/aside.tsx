"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import {
  Config,
  Earth,
  Home,
  Lightning,
  ListCheck,
  ShootingStar,
  Support,
} from "@mynaui/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Logo from "./logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/websites", icon: Earth, label: "Websites" },
  { href: "/analytics", icon: Lightning, label: "Analytics" },
  { href: "/subscription", icon: ShootingStar, label: "Subscription" },
  { href: "/settings", icon: Config, label: "Settings" },
];

const secondaryNavItems = [
  { href: "/changelog", icon: ListCheck, label: "Changelog" },
  { href: "/help", icon: Support, label: "Help & Guides" },
];

export default function Aside() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar>
      <SidebarHeader className="h-[46px] flex-row items-center justify-between px-4 pb-3 pt-4">
        <Logo colorMode="mono" />
        <Suspense
          fallback={
            <div className="block size-6 shrink-0 rounded-full bg-sidebar-border">
            </div>
          }
        >
          <SignedIn>
            <div className="block size-6 shrink-0 rounded-full bg-sidebar-border [&_.cl-avatarBox]:size-6 [&_button]:size-6">
              <UserButton />
            </div>
          </SignedIn>
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <item.icon stroke={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <item.icon stroke={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
