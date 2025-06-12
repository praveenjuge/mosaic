import { website_name } from "@/lib/constants";
import Link from "next/link";
import Logo from "./logo";

const footerSections = [
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help & Guides" },
      { href: "/blog", label: "Blog" },
      { href: "/changelog", label: "Changelog" },
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
  return (
    <footer className="bg-background mt-auto border-t-[0.5px]">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="gap-4 space-y-8 xl:col-span-1">
            <Logo />
            <p className="text-muted-foreground mt-4">
              Transform your website&apos;s Open Graph social images by
              automatically using your hero section as an OG Image.
            </p>
            <div className="flex space-x-6">
              {/* Add social links if needed */}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-foreground mb-2 leading-6 font-semibold">
                  {footerSections[0].title}
                </h3>
                <ul role="list" className="space-y-2">
                  {footerSections[0].links.map((link) => (
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
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-foreground mb-2 leading-6 font-semibold">
                  {footerSections[1].title}
                </h3>
                <ul role="list" className="space-y-2">
                  {footerSections[1].links.map((link) => (
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
          </div>
        </div>
        <div className="mt-12 border-t-[0.5px] pt-8">
          <p className="text-muted-foreground xl:text-center">
            &copy; {new Date().getFullYear()} {website_name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
