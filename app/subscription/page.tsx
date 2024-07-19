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
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/nextjs";
import { Check, ChevronDown } from "@mynaui/icons-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Manage your billing and invoices here.",
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="border-b-[0.5px]">
            <CardTitle>Free</CardTitle>
            <CardDescription>For trying out</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">$0</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <ul className="mt-8 grid w-full gap-2">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>250 images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>2 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>No support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b-[0.5px]">
            <CardTitle>Pro</CardTitle>
            <CardDescription>For individual use</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">$19</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <ul className="mt-8 grid w-full gap-2">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>5000 images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>20 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b-[0.5px]">
            <CardTitle>Teams</CardTitle>
            <CardDescription>For small to medium teams</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">$99</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <ul className="mt-8 grid w-full gap-2">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>100 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Priority email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b-[0.5px]">
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>For large organizations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">
              Contact us
            </div>
            <div className="text-sm text-muted-foreground">
              Custom pricing and features
            </div>
            <ul className="mt-8 grid w-full gap-2">
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Unlimited storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5 text-primary" stroke={2} />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <a
              href="mailto:hello@praveenjuge.com"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Contact Sales
            </a>
          </CardFooter>
        </Card>
      </div>
      <SignedIn>
        <Card>
          <CardHeader>
            <CardTitle>You are a Pro User! 🎉</CardTitle>
            <CardDescription>Enjoy your benefits.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>You are not subscribed yet.</CardTitle>
            <CardDescription>Subscribe to get more benefits.</CardDescription>
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
