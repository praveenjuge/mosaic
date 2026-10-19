import { cn } from "@/lib/utils";
import { Link, useRouteContext } from "@tanstack/react-router";
import Logo from "../logo";
import HeaderAuth from "./header-auth";

const navLinkClass =
  "text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-sm transition-colors";

/** Signed-out visitors get the landing page's sections; users get the app. */
function HeaderNav() {
  const { auth } = useRouteContext({ from: "__root__" });

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5">
      {auth.userId ? (
        <Link
          to="/"
          className={navLinkClass}
          activeOptions={{ exact: true }}
          activeProps={{ className: "text-foreground" }}
        >
          Dashboard
        </Link>
      ) : (
        <>
          <Link
            to="/"
            hash="features"
            className={cn(navLinkClass, "hidden sm:inline-flex")}
          >
            Features
          </Link>
          <Link
            to="/"
            hash="pricing"
            className={cn(navLinkClass, "hidden sm:inline-flex")}
          >
            Pricing
          </Link>
        </>
      )}
      <Link
        to="/help"
        className={navLinkClass}
        activeProps={{ className: "text-foreground" }}
      >
        Help
      </Link>
    </nav>
  );
}

const Header = () => {
  return (
    <header className="bg-background/80 supports-backdrop-filter:bg-background/70 sticky top-0 z-50 w-full border-b backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-6">
          <Logo />
          <HeaderNav />
        </div>
        <HeaderAuth />
      </div>
    </header>
  );
};

export default Header;
