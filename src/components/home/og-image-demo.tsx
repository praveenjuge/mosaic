"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowRight, CornerDownRight } from "lucide-react";
import { useState } from "react";

interface DemoData {
  normalizedUrl: string;
  title: string;
  description: string;
  image: string;
  imageUrl: string | null;
  error?: string;
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
        <div className="bg-muted flex size-full items-center justify-center">
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
    <div className="bg-muted flex flex-col gap-0.5 p-3.5">
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

const fallbackOriginalImage = "/images/original-example-og-814873d7.jpg";
const fallbackMosaicImage = "/images/mosaic-example-og-f9e253a9.png";

export default function OGImageDemo() {
  const [inputUrl, setInputUrl] = useState("");
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [error, setError] = useState("");
  const [mosaicImageUrl, setMosaicImageUrl] = useState(fallbackMosaicImage);

  const fetchOGData = async () => {
    if (!inputUrl) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setIsScreenshotLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/demo?url=${encodeURIComponent(inputUrl)}`,
      );
      const data: DemoData = await response.json();

      setDemoData(data);

      if (data.error) {
        setError(data.error);
        setMosaicImageUrl(fallbackMosaicImage);
      } else if (data.imageUrl) {
        setMosaicImageUrl(data.imageUrl);
      } else {
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
  };

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
        <div className="divide-y- border- flex w-full flex-col overflow-hidden rounded-lg">
          <ImageContainer
            isLoading={isLoading}
            src={demoData?.image || fallbackOriginalImage}
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
        <div className="divide-y- border- flex w-full flex-col overflow-hidden rounded-lg">
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
