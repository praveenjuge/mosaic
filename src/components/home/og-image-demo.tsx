import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowRight, CornerDownRight } from "lucide-react";
import { useState, type FormEvent } from "react";

interface DemoData {
  normalizedUrl: string;
  title: string;
  description: string;
  image: string;
  imageUrl: string | null;
  error?: string;
  /** Set when the live screenshot was skipped and an example is shown. */
  notice?: string;
}

type Preview = { title: string; description: string; url: string };

/** An image URL, plus resized copies when it's one of the bundled examples. */
type PreviewImage = { src: string; srcSet?: string };

interface PreviewCardProps {
  isLoading: boolean;
  image: PreviewImage;
  alt: string;
  preview: Preview;
  /** The first card's image is the largest paint on phones. */
  priority?: boolean;
}

function PreviewCard({
  isLoading,
  image,
  alt,
  preview,
  priority = false,
}: PreviewCardProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg">
      <div className="relative h-52 w-full">
        {isLoading ? (
          <Skeleton className="bg-primary size-full rounded-none" />
        ) : (
          <>
            <Skeleton className="absolute inset-0 size-full rounded-none" />
            <img
              src={image.src}
              srcSet={image.srcSet}
              // Cards sit side by side from `md` up, in a `max-w-4xl` row.
              sizes={
                image.srcSet
                  ? "(min-width: 768px) 420px, calc(100vw - 32px)"
                  : undefined
              }
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              alt={alt}
              width={600}
              height={250}
              className="relative size-full object-cover"
            />
          </>
        )}
      </div>
      <div className="bg-muted flex flex-col gap-0.5 p-3.5">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <p className="line-clamp-1 font-semibold">{preview.title}</p>
            <p className="line-clamp-2">{preview.description}</p>
            <p className="text-muted-foreground">{preview.url}</p>
          </>
        )}
      </div>
    </div>
  );
}

const defaultPreview: Preview = {
  title: "To Use or Not to Use Auto Layout in Figma",
  description:
    "The debate on whether or not to use Auto Layout in Figma is a hot topic that frequently surfaces on Twitter. Based on my experience with this…",
  url: "praveenjuge.com",
};

const fallbackOriginalImage: PreviewImage = {
  src: "/images/original-example-og-864w-2b3240f3.webp",
  srcSet:
    "/images/original-example-og-432w-6e96ba9e.webp 432w, /images/original-example-og-864w-2b3240f3.webp 864w",
};
const fallbackMosaicImage: PreviewImage = {
  src: "/images/mosaic-example-og-864w-a55bc7b7.webp",
  srcSet:
    "/images/mosaic-example-og-432w-68c1e9d2.webp 432w, /images/mosaic-example-og-864w-a55bc7b7.webp 864w",
};

export default function OGImageDemo() {
  const [inputUrl, setInputUrl] = useState("");
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputUrl) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/use?url=${encodeURIComponent(inputUrl)}&mode=demo`,
      );
      const data: DemoData = await response.json();
      setDemoData(data);
      if (data.error) {
        setError(data.error);
      } else if (!data.imageUrl) {
        setError("Failed to generate OG Image. Using fallback image.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data. Please check if the URL is correct and try again!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const preview: Preview = {
    title: demoData?.title ?? defaultPreview.title,
    description: demoData?.description ?? defaultPreview.description,
    url: demoData?.normalizedUrl ?? defaultPreview.url,
  };
  const originalUrl = demoData?.image;
  const originalImage = originalUrl
    ? { src: originalUrl }
    : fallbackOriginalImage;
  const mosaicUrl = !demoData?.error && demoData?.imageUrl;
  const mosaicImage = mosaicUrl ? { src: mosaicUrl } : fallbackMosaicImage;

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
      {error ? (
        <p className="text-destructive mb-6 text-center" role="alert">
          {error}
        </p>
      ) : demoData?.notice ? (
        <p className="text-muted-foreground mb-6 text-center" role="status">
          {demoData.notice}
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-4 text-xs md:flex-row">
        <PreviewCard
          isLoading={isLoading}
          image={originalImage}
          alt="Original Open Graph Image"
          preview={preview}
          priority
        />
        <span
          className="text-muted-foreground pointer-events-none grid size-7 shrink-0 place-items-center select-none"
          aria-hidden="true"
        >
          <ArrowRight className="hidden size-7 md:block" />
          <ArrowDown className="size-7 md:hidden" />
        </span>
        <PreviewCard
          isLoading={isLoading}
          image={mosaicImage}
          alt="Mosaic Open Graph Image"
          preview={preview}
        />
      </div>
    </div>
  );
}
