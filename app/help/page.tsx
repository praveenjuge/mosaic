import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Book,
  ChevronDown,
  Code,
  Config,
  Envelope,
  Shield,
  Ticket,
} from "@mynaui/icons-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Help & Support</CardTitle>
        <CardDescription>
          Find solutions to common issues and get help with troubleshooting.
        </CardDescription>
      </CardHeader>
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
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>
            Explore our knowledge base for more detailed information and guides.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md bg-muted p-4 transition-colors hover:bg-muted/80"
            prefetch={false}
          >
            <Book className="h-6 w-6 text-muted-foreground" />
            <span className="font-semibold">Getting Started</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md bg-muted p-4 transition-colors hover:bg-muted/80"
            prefetch={false}
          >
            <Code className="h-6 w-6 text-muted-foreground" />
            <span className="font-semibold">Developer Guides</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md bg-muted p-4 transition-colors hover:bg-muted/80"
            prefetch={false}
          >
            <Shield className="h-6 w-6 text-muted-foreground" />
            <span className="font-semibold">Security &amp; Compliance</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-md bg-muted p-4 transition-colors hover:bg-muted/80"
            prefetch={false}
          >
            <Config className="h-6 w-6 text-muted-foreground" />
            <span className="font-semibold">Advanced Settings</span>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Need Further Assistance?</CardTitle>
          <CardDescription>
            If you can't find the answer you're looking for, please don't
            hesitate to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            prefetch={false}
          >
            <Envelope className="mr-2 h-4 w-4" />
            Email Support
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            prefetch={false}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Submit a Ticket
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
