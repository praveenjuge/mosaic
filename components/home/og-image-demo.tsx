/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowDown, ArrowRight, CornerDownRight } from "lucide-react";
import { useCallback, useState } from "react";

interface DemoData {
  normalizedUrl: string;
  title: string;
  description: string;
  image: string;
  screenshotApiUrl: string;
}

interface ImageContainerProps {
  isLoading: boolean;
  src: string | null;
  alt: string;
  isScreenshotLoading?: boolean;
}

function ImageContainer({
  isLoading,
  src,
  alt,
  isScreenshotLoading,
}: ImageContainerProps) {
  const showSkeleton = isLoading || isScreenshotLoading;

  return (
    <div className="relative h-52 w-full">
      {showSkeleton ? (
        <Skeleton className="bg-primary size-full rounded-none" />
      ) : src ? (
        <>
          <Skeleton className="absolute inset-0 size-full rounded-none" />
          <img
            src={src}
            alt={alt}
            width={600}
            height={250}
            className="relative size-full object-cover"
          />
        </>
      ) : (
        <div className="bg-primary-foreground flex size-full items-center justify-center">
          <p>No OG image available</p>
        </div>
      )}
    </div>
  );
}

interface ContentContainerProps {
  isLoading: boolean;
  title: string;
  description: string;
  url: string;
}

function ContentContainer({
  isLoading,
  title,
  description,
  url,
}: ContentContainerProps) {
  return (
    <div className="bg-primary-foreground flex flex-col gap-0.5 p-3.5">
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </>
      ) : (
        <>
          <p className="line-clamp-1 font-semibold">{title}</p>
          <p className="line-clamp-2">{description}</p>
          <p className="text-muted-foreground">{url}</p>
        </>
      )}
    </div>
  );
}

const defaultData = {
  title: "To Use or Not to Use Auto Layout in Figma",
  description:
    "The debate on whether or not to use Auto Layout in Figma is a hot topic that frequently surfaces on Twitter. Based on my experience with this…",
  url: "praveenjuge.com",
};

export default function OGImageDemo() {
  const [inputUrl, setInputUrl] = useState("");
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [error, setError] = useState("");
  const [mosaicImageUrl, setMosaicImageUrl] = useState(
    "/images/mosaic-example-og.png",
  );
  const fetchDemoData = useAction(api.metadata.fetchDemoData);

  const fetchOGData = useCallback(async () => {
    if (!inputUrl) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setIsScreenshotLoading(true);
    setError("");

    try {
      const data = await fetchDemoData({ url: inputUrl });
      setDemoData(data);
      setIsLoading(false);

      // Fetch screenshot using the API URL returned from Convex
      try {
        const screenshotResponse = await fetch(data.screenshotApiUrl);
        if (!screenshotResponse.ok) {
          throw new Error(`Screenshot API error: ${screenshotResponse.status}`);
        }
        const screenshotData = await screenshotResponse.json();

        if (screenshotData.imageUrl) {
          setMosaicImageUrl(screenshotData.imageUrl);
        } else {
          throw new Error("No image URL received");
        }
      } catch (screenshotError) {
        console.error("Screenshot error:", screenshotError);
        setError("Failed to generate OG Image. Using fallback image.");
      }
    } catch (err) {
      console.log("Error fetching data:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load data. Please check if the URL is correct and try again!";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsScreenshotLoading(false);
    }
  }, [fetchDemoData, inputUrl]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchOGData();
  };

  return (
    <div className="relative mx-auto max-w-4xl pb-16">
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-4 md:flex-row"
      >
        <Input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter your website URL"
          aria-label="Enter URL for OG image preview"
          className="bg-background dark:bg-background"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading}
          className="bg-background dark:bg-background"
        >
          Get a Live Demo of your new OG Image
          <CornerDownRight className="size-4" />
        </Button>
      </form>
      {error && (
        <p className="text-destructive mb-6 text-center" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col items-center gap-4 text-xs md:flex-row">
        <div className="flex w-full flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
          <ImageContainer
            isLoading={isLoading}
            src={demoData?.image || "/images/original-example-og.jpg"}
            alt="Original Open Graph Image"
          />
          <ContentContainer
            isLoading={isLoading}
            title={demoData?.title ?? defaultData.title}
            description={demoData?.description ?? defaultData.description}
            url={demoData?.normalizedUrl ?? defaultData.url}
          />
        </div>
        <span
          className="text-muted-foreground pointer-events-none grid size-7 shrink-0 place-items-center select-none"
          aria-hidden="true"
        >
          <ArrowRight className="hidden size-7 md:block" />
          <ArrowDown className="size-7 md:hidden" />
        </span>
        <div className="flex w-full flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
          <ImageContainer
            isLoading={isLoading}
            src={mosaicImageUrl}
            alt="Mosaic Open Graph Image"
            isScreenshotLoading={isScreenshotLoading}
          />
          <ContentContainer
            isLoading={isLoading}
            title={demoData?.title ?? defaultData.title}
            description={demoData?.description ?? defaultData.description}
            url={demoData?.normalizedUrl ?? defaultData.url}
          />
        </div>
      </div>
    </div>
  );
}
