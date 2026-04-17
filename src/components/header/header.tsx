import Logo from "../logo";
import HeaderAuth from "./header-auth";

const Header = () => {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4">
        <Logo />

        <div className="flex items-center gap-4 md:gap-6">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
};

export default Header;
