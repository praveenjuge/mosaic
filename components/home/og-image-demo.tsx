/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface OGData {
  title: string;
  description: string;
  image: string;
}

export default function OGImageDemo() {
  const [inputUrl, setInputUrl] = useState<string>("");
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
      if (!response.ok) {
        throw new Error("Failed to fetch OG data");
      }
      const data: OGData = await response.json();
      setOgData(data);
      setDisplayUrl(inputUrl);
    } catch (error) {
      console.error("Error fetching OG data:", error);
      setError("Failed to load OG data. Please check the URL and try again.");
    }
    setIsLoading(false);
  }, [inputUrl]);

  const mosaicImageUrl = displayUrl
    ? `https://mosaicimg.com/use?url=${encodeURIComponent(displayUrl)}`
    : "/images/mosaic-example-og.png";

  return (
    <section
      className="relative -mt-10 border-b-[0.5px] py-16 md:-mx-10"
      aria-labelledby="og-image-demo-title"
    >
      <h2 id="og-image-demo-title" className="sr-only">
        OG Image Demo
      </h2>
      <Image
        src="/images/homebg.png"
        alt=""
        width={1000}
        height={1000}
        className="pointer-events-none absolute left-0 top-0 -z-10 hidden size-full select-none object-cover object-top dark:hidden md:block"
      />
      <div className="relative mx-auto max-w-4xl sm:px-4">
        <div className="mb-6 flex gap-4">
          <div className="grow">
            <label htmlFor="url-input" className="sr-only">
              Enter URL for OG image preview
            </label>
            <Input
              id="url-input"
              placeholder="Enter a URL (e.g., https://praveenjuge.com)"
              value={inputUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputUrl(e.target.value)
              }
              aria-describedby="url-input-description"
            />
            <p
              id="url-input-description"
              className="mt-2 text-sm text-muted-foreground"
            >
              Enter a URL to see its Open Graph image preview
            </p>
          </div>
          <Button onClick={fetchOGData} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              "Get OG Data"
            )}
          </Button>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col items-center gap-4 text-xs md:flex-row">
          <div className="flex w-full flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
            <div className="relative h-52 w-full">
              {isLoading ? (
                <Skeleton className="size-full" />
              ) : ogData?.image ? (
                <img
                  src={ogData?.image || "/images/original-example-og.jpg"}
                  alt="Original Open Graph Image"
                  className="size-full object-cover"
                  width={600}
                  height={250}
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gray-100">
                  <p>No image available</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 bg-primary-foreground p-3.5">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    {ogData?.title ||
                      "To Use or Not to Use Auto Layout in Figma"}
                  </p>
                  <p className="line-clamp-2">
                    {ogData?.description ||
                      "The debate on whether or not to use Auto Layout in Figma is a hot topic that frequently surfaces on Twitter. Based on my experience with this…"}
                  </p>
                  <p className="text-muted-foreground">
                    {displayUrl || "praveenjuge.com"}
                  </p>
                </>
              )}
            </div>
          </div>
          <span
            className="pointer-events-none grid size-7 shrink-0 select-none place-items-center text-muted-foreground"
            aria-hidden="true"
          >
            <ArrowRight className="hidden size-7 md:block" />
            <ArrowDown className="size-7 md:hidden" />
          </span>
          <div className="flex w-full flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
            <div className="relative h-52 w-full">
              {isLoading ? (
                <Skeleton className="size-full" />
              ) : (
                <img
                  src={mosaicImageUrl}
                  alt="Mosaic Open Graph Image"
                  className="size-full object-cover"
                  width={600}
                  height={250}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 bg-primary-foreground p-3.5">
              <p className="font-semibold">
                {ogData?.title || "To Use or Not to Use Auto Layout in Figma"}
              </p>
              <p className="line-clamp-2">
                {ogData?.description ||
                  "The debate on whether or not to use Auto Layout in Figma is a hot topic that frequently surfaces on Twitter. Based on my experience with this…"}
              </p>
              <p className="text-muted-foreground">
                {displayUrl || "praveenjuge.com"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
