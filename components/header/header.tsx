import Link from "next/link";
import { Suspense } from "react";
import Logo from "../logo";
import HeaderAuth from "./header-auth";

const Header = () => {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b-[0.5px] backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4">
        <Logo />

        {/* Right side - Navigation and Auth */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Pricing
          </Link>
          <Suspense fallback={<div className="h-8 w-16" />}>
            <HeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
};

export default Header;
