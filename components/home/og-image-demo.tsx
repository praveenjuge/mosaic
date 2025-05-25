/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowRight, FatCornerRightDown } from "@mynaui/icons-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

interface OGData {
  title: string;
  description: string;
  image: string;
}

const ImageContainer = ({
  isLoading,
  src,
  alt,
}: {
  isLoading: boolean;
  src: string | null;
  alt: string;
}) => (
  <div className="relative h-52 w-full">
    {isLoading ? <Skeleton className="size-full" /> : src
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
  const [error, setError] = useState("");

  const fetchOGData = useCallback(async () => {
    if (!inputUrl) {
      setError("Please enter a URL");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://api.dub.co/metatags?url=${encodeURIComponent(inputUrl)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch OG data");
      setOgData(await response.json());
      setSubmittedUrl(inputUrl);
    } catch (error) {
      console.log("Error fetching OG data:", error);
      setError(
        "Failed to load OG data. Please check if the URL is correct and try again!",
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputUrl]);

  const mosaicImageUrl = useMemo(
    () =>
      submittedUrl
        ? `https://get.mosaicimg.com/image/get_test_image?url=${
          encodeURIComponent(submittedUrl)
        }`
        : "/images/mosaic-example-og.png",
    [submittedUrl],
  );

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
            placeholder="Enter your website URL"
            aria-label="Enter URL for OG image preview"
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
