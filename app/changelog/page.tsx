import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "@mynaui/icons-react";

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Changelog</CardTitle>
        <CardDescription>
          See what's new in the latest version of our app.
        </CardDescription>
      </CardHeader>
      <Card>
        <CardHeader>
          <CardTitle>New Features</CardTitle>
          <CardDescription>
            <span className="font-medium">Version 2.1.0</span>
            <span> - </span>
            <span>July 7, 2024</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Added a dark mode option for improved visibility in low light
                  conditions.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Improved Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Enhanced the analytics dashboard with more detailed insights
                  and reporting.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Major Updates</CardTitle>
          <CardDescription>
            <span className="font-medium">Version 2.0.0</span>
            <span> - </span>
            <span>June 15, 2024</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Redesigned User Interface</p>
                <p className="text-sm text-muted-foreground">
                  Completely overhauled the user interface with a modern and
                  intuitive design.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Improved Performance</p>
                <p className="text-sm text-muted-foreground">
                  Optimized the codebase for better performance and faster load
                  times.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Enhancements</CardTitle>
          <CardDescription>
            <span className="font-medium">Version 1.5.0</span>
            <span> - </span>
            <span>April 30, 2024</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Improved Accessibility</p>
                <p className="text-sm text-muted-foreground">
                  Implemented WCAG 2.1 guidelines to improve accessibility for
                  users with disabilities.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary">
                <Plus className="size-4 shrink-0" stroke={2} />
              </span>
              <div>
                <p className="font-medium">Expanded Integrations</p>
                <p className="text-sm text-muted-foreground">
                  Added support for more third-party integrations, including
                  popular CRM and marketing tools.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
