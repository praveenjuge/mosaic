import { Button } from "@/components/ui/button";
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
import { Check, ChevronDown } from "@mynaui/icons-react";

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>Subscription</CardTitle>
        <CardDescription>TODO: Manage billing and pricing.</CardDescription>
      </CardHeader>
      <div className="grid w-full grid-cols-1 gap-6 pb-4 md:grid-cols-3">
        <Card>
          <CardHeader className="border-b-[0.5px] border-slate-300">
            <CardTitle>Pro</CardTitle>
            <CardDescription>For individual use</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">$19</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <ul className="mt-8 grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>500 images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>2 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>coming soon</CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b-[0.5px] border-slate-300">
            <CardTitle>Teams</CardTitle>
            <CardDescription>For small to medium teams</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-1 text-4xl font-bold tracking-tight">$59</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <ul className="mt-8 grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>20 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Priority email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Get Started
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b-[0.5px] border-slate-300">
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
            <ul className="mt-8 grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Unlimited storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" stroke={2} />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Contact Sales
            </Button>
          </CardFooter>
        </Card>
      </div>
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
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border pl-4">
                <h4 className="text-sm font-medium">
                  How do I reset my password?
                </h4>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2 text-muted-foreground">
              <p>To reset your password, follow these steps:</p>
              <ol className="list-inside list-decimal">
                <li>
                  Click on your profile avatar in the top-right corner and
                  select "Settings".
                </li>
                <li>In the "Account" section, click on "Change Password".</li>
                <li>
                  Enter your current password and a new password, then confirm
                  the new password.
                </li>
                <li>Click "Save Changes" to update your password.</li>
              </ol>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border pl-4">
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
                  Click on the "Billing" tab in the left-hand navigation menu.
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
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border pl-4">
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
                  Click on the "Billing" tab in the left-hand navigation menu.
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
              <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border pl-4">
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
