import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Logo from "./logo";

export default function Aside() {
  return (
    <aside className="flex h-screen max-h-screen min-h-screen w-56 min-w-56 flex-col gap-6 border-r-[0.5px] border-slate-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="size-6 [&_.cl-avatarBox]:size-6 [&_button]:size-6">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        <Link href="/">Home</Link>
        <Link href="/websites">Websites</Link>
        <Link href="/analytics">Analytics</Link>
        <Link href="/subscription">Subscription</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/changelog">Changelog</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/help">Help & Support</Link>
        <Link href="/legal">Privacy & Terms</Link>
      </nav>
    </aside>
  );
}
