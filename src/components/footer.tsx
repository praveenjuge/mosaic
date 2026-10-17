import { website_name } from "@/lib/constants";
import { Link, useHydrated } from "@tanstack/react-router";
import { Computer, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Logo from "./logo";

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

const themes = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "System theme", Icon: Computer },
];

/** Plain buttons styled like the `Tabs` list, without Radix's Tabs code. */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  // The server can't know the stored theme, so it renders "system".
  const current = hydrated ? (theme ?? "system") : "system";

  return (
    <div className="flex">
      <div
        role="group"
        aria-label="Theme"
        className="bg-muted text-muted-foreground inline-flex h-8 w-fit items-center justify-center rounded-lg p-[3px]"
      >
        {themes.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={current === value}
            onClick={() => setTheme(value)}
            className="text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground dark:aria-pressed:border-input dark:aria-pressed:bg-input/30 dark:aria-pressed:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 aria-pressed:shadow-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-background mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="gap-4 space-y-4 xl:col-span-1">
            <Logo />
            <p className="text-muted-foreground mt-4">
              Transform your website&apos;s Open Graph social images by
              automatically using your hero section as an OG Image.
            </p>
            <ThemeToggle />
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
                        {link.href.startsWith("/") ? (
                          <Link
                            to={link.href}
                            className="text-muted-foreground hover:text-foreground leading-6 transition-colors"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className="text-muted-foreground hover:text-foreground leading-6 transition-colors"
                          >
                            {link.label}
                          </a>
                        )}
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
