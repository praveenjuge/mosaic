import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn, getOgImageUrl } from "@/lib/utils";
import { ClerkLoading, SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { Check, ChevronDown } from "@mynaui/icons-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Manage your billing and invoices here.",
  openGraph: {
    images: [getOgImageUrl("subscription")],
  },
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
        {[
          {
            title: "Free",
            description: "For trying out",
            price: "$0",
            features: ["250 images", "1 website", "2 GB storage", "No support"],
            footer: (
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            ),
          },
          {
            title: "Pro",
            description: "For individual use",
            price: "$19",
            features: [
              "5000 images",
              "Unlimited websites",
              "20 GB storage",
              "Email support",
            ],
            footer: (
              <>
                <ClerkLoading>
                  <Button className="w-full" disabled>
                    Loading...
                  </Button>
                </ClerkLoading>
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button className="w-full">Get Started →</Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  {/* <SignupButton
                    plan={{ id: "310030", variantId: 447876 }}
                    isChangingPlans={false}
                    currentPlan={{ id: "" }}
                    embed={false}
                  /> */}
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </SignedIn>
              </>
            ),
          },
          {
            title: "Teams",
            description: "For small to medium teams",
            price: "$99",
            features: [
              "Unlimited images",
              "Unlimited websites",
              "100 GB storage",
              "Priority email support",
            ],
            footer: (
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            ),
          },
          {
            title: "Enterprise",
            description: "For large organizations",
            price: "Contact us",
            priceSubtext: "Custom pricing and features",
            features: [
              "Unlimited images",
              "Unlimited websites",
              "Unlimited storage",
              "Dedicated account manager",
            ],
            footer: (
              <a
                href="mailto:hello@praveenjuge.com"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Contact Sales
              </a>
            ),
          },
        ].map((plan, index) => (
          <Card key={index}>
            <CardHeader className="border-b-[0.5px]">
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="mb-1 text-4xl font-bold tracking-tight">
                {plan.price}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.priceSubtext || "per month"}
              </div>
              <ul className="mt-8 grid w-full gap-2">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <Check className="size-5 text-primary" stroke={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>{plan.footer}</CardFooter>
          </Card>
        ))}
      </div>
      <SignedIn>
        <Card>
          <CardHeader className="flex justify-between gap-2 md:flex-row">
            <div className="flex flex-col gap-2">
              <CardTitle>Invoice History & Manage Plan</CardTitle>
              <CardDescription>
                Find the details of your previous invoices or to cancel your
                current subscription. If you have any questions regarding your
                invoices, please contact our support team.
              </CardDescription>
            </div>
            {/* TODO */}
            <Button variant="outline">Manage Plan</Button>
          </CardHeader>
        </Card>
      </SignedIn>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            If you can't find the answer you're looking for, please don't
            hesitate to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border-[0.5px] pl-4">
                <h4 className="text-sm font-medium">
                  How do I upgrade my plan?
                </h4>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2 text-muted-foreground">
              <p>To upgrade your plan, follow these steps:</p>
              <ol className="list-inside list-decimal">
                <li>
                  Click on the "Subscription" tab in the left-hand navigation
                  menu.
                </li>
                <li>Under "Your Plan", click on the "Upgrade" button.</li>
                <li>
                  Select the new plan you want to upgrade to and follow the
                  prompts to complete the upgrade process.
                </li>
              </ol>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border-[0.5px] pl-4">
                <h4 className="text-sm font-medium">
                  How do I cancel my subscription?
                </h4>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2 text-muted-foreground">
              <p>To cancel your subscription, follow these steps:</p>
              <ol className="list-inside list-decimal">
                <li>
                  Click on the "Subscription" tab in the left-hand navigation
                  menu.
                </li>
                <li>
                  Under "Your Plan", click on the "Cancel Subscription" button.
                </li>
                <li>Follow the prompts to confirm the cancellation.</li>
              </ol>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border-[0.5px] pl-4">
                <h4 className="text-sm font-medium">
                  How do I add a team member?
                </h4>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2 text-muted-foreground">
              <p>To add a team member, follow these steps:</p>
              <ol className="list-inside list-decimal">
                <li>
                  Click on the "Team" tab in the left-hand navigation menu.
                </li>
                <li>Click on the "Add Member" button.</li>
                <li>
                  Enter the email address of the team member you want to add.
                </li>
                <li>
                  Select the role and permissions for the new team member.
                </li>
                <li>
                  Click "Invite" to send an invitation to the team member.
                </li>
              </ol>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </>
  );
}
