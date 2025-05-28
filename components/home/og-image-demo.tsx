/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowRight, FatCornerRightDown } from "@mynaui/icons-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface OGData {
  title: string;
  description: string;
  image: string;
}

// Normalize URL by adding protocol if missing
function normalizeUrl(url: string): string {
  if (!url) return url;

  // Remove any leading/trailing whitespace
  url = url.trim();

  // If URL already has a protocol, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Add https:// prefix for URLs without protocol
  return `https://${url}`;
}

const ImageContainer = ({
  isLoading,
  src,
  alt,
  isScreenshotLoading,
}: {
  isLoading: boolean;
  src: string | null;
  alt: string;
  isScreenshotLoading?: boolean;
}) => (
  <div className="relative h-52 w-full">
    {isLoading || isScreenshotLoading
      ? <Skeleton className="size-full rounded-none" />
      : src
      ? (
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
      )
      : (
        <div className="flex size-full items-center justify-center bg-primary-foreground">
          <p>No image available</p>
        </div>
      )}
  </div>
);

const ContentContainer = ({
  isLoading,
  title,
  description,
  url,
}: {
  isLoading: boolean;
  title: string;
  description: string;
  url: string;
}) => (
  <div className="flex flex-col gap-0.5 bg-primary-foreground p-3.5">
    {isLoading
      ? (
        <>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </>
      )
      : (
        <>
          <p className="line-clamp-1 font-semibold">{title}</p>
          <p className="line-clamp-2">{description}</p>
          <p className="text-muted-foreground">{url}</p>
        </>
      )}
  </div>
);

const defaultData = {
  title: "To Use or Not to Use Auto Layout in Figma",
  description:
    "The debate on whether or not to use Auto Layout in Figma is a hot topic that frequently surfaces on Twitter. Based on my experience with this…",
  url: "praveenjuge.com",
};

export default function OGImageDemo() {
  const [inputUrl, setInputUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [error, setError] = useState("");
  const [mosaicImageUrl, setMosaicImageUrl] = useState(
    "/images/mosaic-example-og.png",
  );

  const fetchOGData = useCallback(async () => {
    if (!inputUrl) {
      setError("Please enter a URL");
      return;
    }

    // Normalize the URL before processing
    const normalizedUrl = normalizeUrl(inputUrl);

    setIsLoading(true);
    setIsScreenshotLoading(true);
    setError("");

    try {
      // Fetch OG data using our own API
      const ogResponse = await fetch(
        `/api/metadata?url=${encodeURIComponent(normalizedUrl)}`,
      );
      if (!ogResponse.ok) {
        const errorData = await ogResponse.json();
        throw new Error(errorData.error || "Failed to fetch metadata");
      }
      const ogDataResult = await ogResponse.json();
      setOgData(ogDataResult);
      setSubmittedUrl(normalizedUrl);
      setIsLoading(false); // OG data loaded, stop general loading

      // Fetch screenshot (this might take longer)
      try {
        const screenshotResponse = await fetch(
          `/api/screenshot?url=${encodeURIComponent(normalizedUrl)}`,
        );
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
        setError("Failed to generate screenshot. Using fallback image.");
        // Keep the default fallback image
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      setError(
        "Failed to load data. Please check if the URL is correct and try again!",
      );
    } finally {
      setIsLoading(false);
      setIsScreenshotLoading(false);
    }
  }, [inputUrl]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchOGData();
  };

  return (
    <section className="relative -mt-10 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 select-none border-b-[0.5px] md:-mx-10">
        <Image
          src="/images/homebg.png"
          alt=""
          width={1000}
          height={1000}
          className="hidden size-full select-none object-cover object-top dark:hidden md:block"
        />
      </div>
      <div className="relative mx-auto max-w-4xl sm:px-4">
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col gap-4 md:flex-row"
        >
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter your website URL (e.g., github.com)"
            aria-label="Enter URL for OG image preview"
            className="bg-background"
          />
          <Button type="submit" variant="outline" disabled={isLoading}>
            Get a Live Demo of your new OG Image
            <FatCornerRightDown className="size-4" />
          </Button>
        </form>
        {error && (
          <p className="mb-6 text-center text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col items-center gap-4 text-xs md:flex-row">
          <div className="flex w-full flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
            <ImageContainer
              isLoading={isLoading}
              src={ogData
                ? ogData.image || null
                : "/images/original-example-og.jpg"}
              alt="Original Open Graph Image"
            />
            <ContentContainer
              isLoading={isLoading}
              title={ogData?.title || defaultData.title}
              description={ogData?.description || defaultData.description}
              url={submittedUrl || defaultData.url}
            />
          </div>
          <span
            className="pointer-events-none grid size-7 shrink-0 select-none place-items-center text-muted-foreground"
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
              title={ogData?.title || defaultData.title}
              description={ogData?.description || defaultData.description}
              url={submittedUrl || defaultData.url}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
