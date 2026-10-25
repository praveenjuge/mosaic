import { website_name } from "@/lib/constants";
import { Link, useHydrated } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { Computer, Moon, Sun } from "vadivam-react";
import Logo from "./logo";

const footerSections = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/help/use-the-mosaic-api", label: "API" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/help/test-your-social-previews", label: "Test your previews" },
      { href: "mailto:hello@praveenjuge.com", label: "Contact support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal#privacy-policy", label: "Privacy" },
      { href: "/legal#terms-of-service", label: "Terms" },
      { href: "/legal#refund-policy", label: "Refunds" },
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
        className="text-muted-foreground inline-flex h-8 w-fit items-center justify-center rounded-full border p-[3px]"
      >
        {themes.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={current === value}
            onClick={() => setTheme(value)}
            className="text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground aria-pressed:text-foreground dark:aria-pressed:border-input dark:aria-pressed:bg-input/30 dark:aria-pressed:text-foreground aria-pressed:bg-muted relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0"
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

const linkClass =
  "text-muted-foreground hover:text-foreground text-sm transition-colors";

function FooterLink({ href, label }: { href: string; label: string }) {
  if (!href.startsWith("/")) {
    return (
      <a href={href} className={linkClass}>
        {label}
      </a>
    );
  }
  const [to, hash] = href.split("#");
  return (
    <Link to={to} hash={hash} className={linkClass}>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-surface mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Open Graph images from screenshots of your website, generated and
              refreshed automatically.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-medium">{section.title}</h3>
              <ul role="list" className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} {website_name}. All rights
            reserved.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
