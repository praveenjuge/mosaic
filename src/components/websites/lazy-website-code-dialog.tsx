import { lazy, Suspense, type ComponentProps } from "react";

const WebsiteCodeDialog = lazy(() =>
  import("./website-code-dialog").then((module) => ({
    default: module.WebsiteCodeDialog,
  })),
);

/**
 * The code dialog, loaded and mounted only while open: the dashboard renders
 * one per website and image, and most are never opened.
 */
export function LazyWebsiteCodeDialog(
  props: ComponentProps<typeof WebsiteCodeDialog>,
) {
  if (!props.open) return null;
  return (
    <Suspense>
      <WebsiteCodeDialog {...props} />
    </Suspense>
  );
}
