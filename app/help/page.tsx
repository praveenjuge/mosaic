import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Book, Code, Config, Envelope, Shield } from "@mynaui/icons-react";
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Book className="h-6 w-6 text-muted-foreground" />
              <span>Getting Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Code className="h-6 w-6 text-muted-foreground" />
              <span>Developer Guides</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <span>Security &amp; Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Config className="h-6 w-6 text-muted-foreground" />
              <span>Advanced Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
            <Link href="#">Lorem Ipsum</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Further Assistance?</CardTitle>
          <CardDescription>
            If you can't find the answer you're looking for, please don't
            hesitate to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <a href="mailto:hello@praveenjuge.com" className={buttonVariants()}>
            <Envelope className="mr-2 size-4" />
            Email Support
          </a>
          {/* TODO */}
          {/* <a href="#" className={buttonVariants({ variant: "outline" })}>
            <Ticket className="mr-2 size-4" />
            Submit a Ticket
          </a> */}
        </CardContent>
      </Card>
    </div>
  );
}
