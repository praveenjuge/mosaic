import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Globe, LoaderCircle } from "lucide-react";
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
  label: string;
  isLoading: boolean;
  image: PreviewImage;
  alt: string;
  preview: Preview;
  /** The first card's image is the largest paint on phones. */
  priority?: boolean;
  highlight?: boolean;
}

/** A link preview as a social feed shows it: image, title, and domain. */
function PreviewCard({
  label,
  isLoading,
  image,
  alt,
  preview,
  priority = false,
  highlight = false,
}: PreviewCardProps) {
  return (
    <figure className="flex w-full min-w-0 flex-col gap-2.5">
      <figcaption className="text-muted-foreground flex items-center gap-2 px-1 text-xs font-medium">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            highlight ? "bg-brand" : "bg-muted-foreground/40",
          )}
        />
        {label}
      </figcaption>
      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="relative aspect-[1.91/1] w-full border-b">
          {isLoading ? (
            <Skeleton className="size-full rounded-none" />
          ) : (
            <>
              <Skeleton className="absolute inset-0 size-full rounded-none" />
              <img
                src={image.src}
                srcSet={image.srcSet}
                // Cards sit side by side from `md` up, in a `max-w-5xl` row.
                sizes={
                  image.srcSet
                    ? "(min-width: 768px) 480px, calc(100vw - 32px)"
                    : undefined
                }
                fetchPriority={priority ? "high" : undefined}
                decoding="async"
                alt={alt}
                width={600}
                height={314}
                className="relative size-full object-cover object-top"
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-1 p-4 text-xs">
          {isLoading ? (
            <>
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : (
            <>
              <p className="text-muted-foreground truncate">{preview.url}</p>
              <p className="line-clamp-1 text-sm font-medium">
                {preview.title}
              </p>
              <p className="text-muted-foreground line-clamp-2">
                {preview.description}
              </p>
            </>
          )}
        </div>
      </div>
    </figure>
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
    <div className="bg-surface mx-auto w-full max-w-5xl rounded-3xl border p-3 shadow-sm md:p-5">
      <form
        onSubmit={handleSubmit}
        className="bg-background flex flex-col gap-2 rounded-2xl border p-2 shadow-xs sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 pl-2">
          <Globe
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          <Input
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
            }}
            placeholder="yourwebsite.com"
            aria-label="Enter URL for OG image preview"
            className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <Button type="submit" disabled={isLoading} size="lg" className="h-9">
          {isLoading ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          Generate preview
        </Button>
      </form>
      {error ? (
        <p className="text-destructive mt-4 text-center text-sm" role="alert">
          {error}
        </p>
      ) : demoData?.notice ? (
        <p
          className="text-muted-foreground mt-4 text-center text-sm"
          role="status"
        >
          {demoData.notice}
        </p>
      ) : null}
      <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-6">
        <PreviewCard
          label="Your current og:image"
          isLoading={isLoading}
          image={originalImage}
          alt="Original Open Graph Image"
          preview={preview}
          priority
        />
        <PreviewCard
          label="With Mosaic"
          isLoading={isLoading}
          image={mosaicImage}
          alt="Mosaic Open Graph Image"
          preview={preview}
          highlight
        />
      </div>
    </div>
  );
}
