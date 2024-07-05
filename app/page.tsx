import { Button } from "@/components/ui/button";
import {
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <SignedOut>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tighter">
            Simplify Your Open Graph Image Creation.
          </h1>
          <p className="text-base text-slate-500">
            Transform your website into a stunning Open Graph image with our web
            app. Simply input your URL, and get a high-quality snapshot ready
            for social media.
          </p>
          <div className="flex gap-2">
            <ClerkLoading>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
              <Button size="lg" disabled>
                Sign UP
              </Button>
            </ClerkLoading>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg">Sign Up</Button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <h2 className="text-base font-medium">Overview:</h2>
        <h2 className="text-base font-medium">Websites:</h2>
        <h2 className="text-base font-medium">Lastest Images:</h2>
      </SignedIn>
    </>
  );
}
