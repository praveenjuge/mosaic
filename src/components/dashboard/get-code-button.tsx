import { Button } from "@/components/ui/button";
import { lazy, Suspense, useState, type ComponentProps } from "react";

const WebsiteCodeDialog = lazy(() =>
  import("./website-code-dialog").then((module) => ({
    default: module.WebsiteCodeDialog,
  })),
);

/**
 * A button that opens the meta tags dialog for `pageUrl`, or the website's
 * home page. The dialog loads and mounts only while open: the dashboard
 * renders one button per website and image, and most are never opened.
 */
export function GetCodeButton({
  hostname,
  pageUrl,
  ...buttonProps
}: { hostname: string; pageUrl?: string } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        {...buttonProps}
        onClick={() => {
          setOpen(true);
        }}
      />
      {open ? (
        <Suspense>
          <WebsiteCodeDialog
            hostname={hostname}
            pageUrl={pageUrl}
            onClose={() => {
              setOpen(false);
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
