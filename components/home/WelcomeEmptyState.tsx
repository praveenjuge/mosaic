"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleAdd } from "@/components/websites/actions";
import { SubmitButton } from "@/components/websites/submit-button";
import { useState } from "react";
import { toast } from "sonner";

export default function WelcomeEmptyState() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/welcome.png"
            alt="Welcome to Mosaic"
            style={{ width: "350px" }}
          />
          <CardTitle>Welcome to Mosaic</CardTitle>
          <CardDescription className="text-balance">
            Generate beautiful Open Graph images for your websites
            automatically. Add your first website to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            action={async (formData) => {
              setIsSubmitting(true);
              try {
                const { status, message } = await handleAdd(formData);
                if (status === "error") {
                  toast.error(message);
                } else {
                  toast.success(message);
                  // The page will automatically refresh due to revalidation
                }
              } catch {
                toast.error("Something went wrong. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                name="website"
                type="text"
                placeholder="example.com or https://example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <SubmitButton text="Add Website & Generate OG Images" />
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Once added, we&apos;ll generate OG images that you can use in your
              website&apos;s{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                &lt;meta property=&quot;og:image&quot;&gt;
              </code>{" "}
              tag.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
