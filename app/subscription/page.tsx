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
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
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
          <CardFooter>
            <Button className="w-full">Get Started</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="border-b">
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
          <CardHeader className="border-b">
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
    </>
  );
}
