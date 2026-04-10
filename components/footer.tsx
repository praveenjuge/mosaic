"use client";

import { website_name } from "@/lib/constants";
import { Computer, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./logo";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const footerSections = [
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help & Guides" },
      { href: "mailto:hello@praveenjuge.com", label: "Contact Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal#privacy-policy", label: "Privacy Policy" },
      { href: "/legal#terms-of-service", label: "Terms of Service" },
      { href: "/legal#refund-policy", label: "Refund Policy" },
    ],
  },
];

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="bg-background mt-auto border-t-[0.5px]">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="gap-4 space-y-4 xl:col-span-1">
            <Logo />
            <p className="text-muted-foreground mt-4">
              Transform your website&apos;s Open Graph social images by
              automatically using your hero section as an OG Image.
            </p>
            <Tabs
              value={mounted ? (theme ?? "system") : "system"}
              onValueChange={setTheme}
            >
              <TabsList>
                <TabsTrigger value="light">
                  <Sun />
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <Moon />
                </TabsTrigger>
                <TabsTrigger value="system">
                  <Computer />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} {website_name}. All rights
              reserved.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            {footerSections.map((section) => (
              <div
                key={section.title}
                className="md:grid md:grid-cols-1 md:gap-8"
              >
                <div>
                  <h3 className="text-foreground mb-2 leading-6 font-semibold">
                    {section.title}
                  </h3>
                  <ul role="list" className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground leading-6 transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
