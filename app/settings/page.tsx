import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ChartGraph,
  Envelope,
  EnvelopeOpen,
  Key,
  Moon,
  Paperclip,
} from "@mynaui/icons-react";

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          TODO: Manage all your settings in one place
        </CardDescription>
      </CardHeader>
      <div className="grid w-full max-w-2xl gap-8 pb-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose your preferred theme and other appearance settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <Moon className="size-4" stroke={2} />
                  <span>Dark Mode</span>
                </div>
                <Switch id="dark-mode" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Manage your email notification settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <EnvelopeOpen className="size-4" stroke={2} />
                  <span>Email Notifications</span>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <Paperclip className="size-4" stroke={2} />
                  <span>Newsletter Subscription</span>
                </div>
                <Switch id="newsletter-subscriptions" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <Envelope className="size-4" stroke={2} />
                  <span>Marketing Emails</span>
                </div>
                <Switch id="marketing-emails" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
            <CardDescription>
              Manage your API keys and view usage statistics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <Key className="size-4" stroke={2} />
                  <span>API Keys</span>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-medium">
                  <ChartGraph className="size-4" stroke={2} />
                  <span>Usage Statistics</span>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
