"use client";

import { api } from "@/convex/_generated/api";
import { LoadingSpinner } from "@/components/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function WelcomeEmptyState() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const addSite = useMutation(api.sites.addSite);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("website")?.toString() || "";

    if (!url) {
      toast.error("Please enter a valid website URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSite({ url_base: url });
      if (result?.status === "error") {
        toast.error(result?.message ?? "Failed to add website");
      } else {
        toast.success(result?.message ?? "Website added successfully");
        void router.invalidate();
      }
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          <img
            src="/illustrations/welcome.png"
            alt="Welcome to Mosaic"
            width={300}
            height={300}
            className="mb-3"
          />
          <CardTitle>Welcome to Mosaic</CardTitle>
          <CardDescription className="text-balance">
            Generate beautiful Open Graph images for your websites
            automatically. Add your first website to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner size={18} />
              ) : (
                "Add Website & Generate OG Images"
              )}
            </Button>
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
