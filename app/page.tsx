import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { Dots, Globe } from "@mynaui/icons-react";

export default function Home() {
  return (
    <>
      <SignedOut>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-4 text-center">
          <Logo />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tighter">
              Simplify Your Open Graph Image Creation.
            </h1>
            <p className="text-base text-slate-500">
              Transform your website into a stunning Open Graph image with our
              web app. Simply input your URL, and get a high-quality snapshot
              ready for social media.
            </p>
          </div>
          <div className="flex gap-2">
            <ClerkLoading>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
              <Button size="lg" disabled>
                Sign Up
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
        <div className="space-y-8 py-4 md:py-0">
          <div>
            <CardHeader className="mb-4 p-0">
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>413</CardTitle>
                  <CardDescription>Images</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>30 Days</CardTitle>
                  <CardDescription>Cached</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>4321</CardTitle>
                  <CardDescription>Credits Left</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pro Plan</CardTitle>
                  <CardDescription>Subscription</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
          <div>
            <CardHeader className="mb-4 p-0">
              <CardTitle>Websites</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Globe className="size-5" />
                  <div>
                    <div className="font-medium">praveenjuge.com</div>
                    <div className="text-sm text-muted-foreground">
                      32 Images
                    </div>
                  </div>
                </div>
                <Dots className="size-6 text-muted-foreground" />
              </Card>
              <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Globe className="size-5" />
                  <div>
                    <div className="font-medium">mynaui.com</div>
                    <div className="text-sm text-muted-foreground">
                      12 Images
                    </div>
                  </div>
                </div>
                <Dots className="size-6 text-muted-foreground" />
              </Card>
              <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Globe className="size-5" />
                  <div>
                    <div className="font-medium">casts.com</div>
                    <div className="text-sm text-muted-foreground">
                      55 Images
                    </div>
                  </div>
                </div>
                <Dots className="size-6 text-muted-foreground" />
              </Card>
              <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Globe className="size-5" />
                  <div>
                    <div className="font-medium">hello.com</div>
                    <div className="text-sm text-muted-foreground">
                      66 Images
                    </div>
                  </div>
                </div>
                <Dots className="size-6 text-muted-foreground" />
              </Card>
            </div>
          </div>
          <div>
            <CardHeader className="mb-4 p-0">
              <CardTitle>Latest Cached Images</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <img
                  src="https://generated.vusercontent.net/placeholder.svg"
                  alt="Cached Image 1"
                  className="h-auto w-full rounded-lg"
                />
              </Card>
              <Card>
                <img
                  src="https://generated.vusercontent.net/placeholder.svg"
                  alt="Cached Image 2"
                  className="h-auto w-full rounded-lg"
                />
              </Card>
              <Card>
                <img
                  src="https://generated.vusercontent.net/placeholder.svg"
                  alt="Cached Image 3"
                  className="h-auto w-full rounded-lg"
                />
              </Card>
              <Card>
                <img
                  src="https://generated.vusercontent.net/placeholder.svg"
                  alt="Cached Image 4"
                  className="h-auto w-full rounded-lg"
                />
              </Card>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
