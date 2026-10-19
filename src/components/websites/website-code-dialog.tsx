import { GuideLink } from "@/components/help/guides";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guideLinks } from "@/lib/content";
import { publicEnv } from "@/lib/env";
import { buildMetaTags, pageUrlFor, type PageProtocol } from "@/lib/meta-tags";
import { buildUseEndpointUrl } from "@/lib/url";
import { Link } from "@tanstack/react-router";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<CopyState>("idle");

  const show = (next: CopyState) => {
    setState(next);
    setTimeout(
      () => {
        setState("idle");
      },
      next === "failed" ? 4000 : 2000,
    );
  };

  const copy = () => {
    // The browser can refuse clipboard access; the text stays selectable.
    navigator.clipboard.writeText(text).then(
      () => {
        show("copied");
      },
      () => {
        show("failed");
      },
    );
  };

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {state === "copied" ? (
        <Check className="text-brand" />
      ) : state === "failed" ? (
        <TriangleAlert className="text-destructive" />
      ) : (
        <Copy />
      )}
      <span aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Couldn't copy. Select the text instead."
            : label}
      </span>
    </Button>
  );
}

/**
 * Ready-to-paste meta tags for any page of a website. Controlled, so a
 * website row and an image card can open it for a given page. Load it
 * through `LazyWebsiteCodeDialog`.
 */
export function WebsiteCodeDialog({
  hostname,
  initialPath = "",
  protocol = "https:",
  open,
  onOpenChange,
}: {
  hostname: string;
  initialPath?: string;
  /** An image card's page can be `http:`, which has its own image. */
  protocol?: PageProtocol;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathId = useId();
  const [path, setPath] = useState(initialPath);
  const pageUrl = pageUrlFor(hostname, path, protocol);
  const tags = buildMetaTags(pageUrl);
  const imageUrl = buildUseEndpointUrl(publicEnv.siteUrl, pageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Short phone screens lock page scrolling, so the dialog scrolls. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Mosaic to {hostname}</DialogTitle>
          <DialogDescription>
            Paste these tags in the page&apos;s <code>&lt;head&gt;</code>. Each
            page gets its own screenshot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-w-0 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={pathId}>Page</Label>
            <div className="border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex h-8 items-center rounded-lg border text-sm focus-within:ring-3">
              <span className="text-muted-foreground border-r px-2.5 select-none">
                {protocol === "http:" ? "http://" : ""}
                {hostname}/
              </span>
              <Input
                id={pathId}
                value={path.replace(/^\/+/, "")}
                onChange={(event) => {
                  setPath(event.target.value);
                }}
                placeholder="blog/my-post"
                className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
          </div>
          <div className="bg-muted/50 min-w-0 overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                HTML
              </span>
              <CopyTextButton text={tags} label="Copy tags" />
            </div>
            <pre className="p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
              <code>{tags}</code>
            </pre>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyTextButton text={imageUrl} label="Copy image link" />
            <Button variant="ghost" size="sm" asChild>
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                Preview image
              </a>
            </Button>
          </div>
          <div className="grid gap-2 border-t pt-4">
            <p className="text-muted-foreground text-xs">
              Using a framework? Follow its guide, then{" "}
              <Link
                to="/help/$slug"
                params={{ slug: "test-your-social-previews" }}
                className="text-foreground underline underline-offset-4"
              >
                test your previews
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-1.5">
              {guideLinks.map((guide) => (
                <GuideLink key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
