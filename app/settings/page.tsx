import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Metadata } from "next";
import { ModeToggle } from "./theme-toggler";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "You can customize your experience and configure various aspects our service here.",
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full max-w-2xl gap-8 pb-4">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <ModeToggle />
          </CardContent>
        </Card>
        {/* TODO */}
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences (Coming Soon)</CardTitle>
            <CardDescription>
              Manage your email notification settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 font-medium">
              <div className="flex items-center justify-between">
                <span>75% of usage used</span>
                <Switch id="75-usage" disabled />
              </div>
              <div className="flex items-center justify-between">
                <span>100% of usage used</span>
                <Switch id="100-usage" disabled />
              </div>
              <div className="flex items-center justify-between">
                <span>New feature announcements</span>
                <Switch id="newsletter" disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
