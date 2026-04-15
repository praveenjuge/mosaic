"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useWebsiteActions } from "@/components/websites/use-website-actions";
import { WebsiteUrlForm } from "@/components/websites/website-url-form";

export default function WelcomeEmptyState() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveWebsite } = useWebsiteActions();

  const handleSubmit = async (url: string) => {
    setIsSubmitting(true);

    try {
      await saveWebsite({ url });
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
          <WebsiteUrlForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel="Add Website & Generate OG Images"
          />
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
