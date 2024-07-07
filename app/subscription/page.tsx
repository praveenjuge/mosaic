import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "@mynaui/icons-react";

export default function Page() {
  return (
    <>
      <div className="grid w-full grid-cols-1 gap-6 px-4 md:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Pro</CardTitle>
            <CardDescription>For individual use</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="text-4xl font-bold tracking-tight">$9</div>
            <div className="text-sm text-muted-foreground">/month</div>
            <ul className="grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>5 projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited collaborators</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>2 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Get Started</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Teams</CardTitle>
            <CardDescription>For small to medium teams</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="text-4xl font-bold tracking-tight">$49</div>
            <div className="text-sm text-muted-foreground">/month</div>
            <ul className="grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited collaborators</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>20 GB storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Priority email support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Get Started</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>For large organizations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="text-4xl font-bold tracking-tight">Contact us</div>
            <div className="text-sm text-muted-foreground">
              Custom pricing and features
            </div>
            <ul className="grid w-full gap-3">
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited collaborators</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Unlimited storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-5" />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Contact Sales</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
