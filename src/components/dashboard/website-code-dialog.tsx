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
import { buildMetaTags, pageUrlFor, splitPageUrl } from "@/lib/meta-tags";
import { useEndpointUrl } from "@/lib/url";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "vadivam-react";

type CopyState = "idle" | "copied" | "failed";

function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const show = (next: CopyState) => {
    setState(next);
    // A second click restarts the wait instead of being cut short by the first.
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(
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
 * Ready-to-paste meta tags for any page of a website, starting at `pageUrl`
 * (an `http:` page keeps its protocol, since it has its own image) or the
 * home page. Opened through `GetCodeButton`.
 */
export function WebsiteCodeDialog({
  hostname,
  pageUrl: initialPageUrl,
  open,
  onOpenChange,
}: {
  hostname: string;
  pageUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathId = useId();
  const initial = initialPageUrl
    ? splitPageUrl(initialPageUrl)
    : { path: "", protocol: "https:" as const };
  const { protocol } = initial;
  const [path, setPath] = useState(initial.path);
  const pageUrl = pageUrlFor(hostname, path, protocol);
  const tags = buildMetaTags(pageUrl);
  const imageUrl = useEndpointUrl(pageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Short phone screens lock page scrolling, so the dialog scrolls. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl!">
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
                bare
                className="h-full px-2.5"
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
