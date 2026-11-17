import { DAY_MS } from "@/lib/utils";

export const author_name = "Praveen Juge";
export const support_email = "hello@praveenjuge.com";
export const author_x_url = "https://x.com/PraveenJuge";
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Transform your website's Open Graph social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.";

/** Every OG image: a desktop viewport in the 1.91:1 shape link previews use. */
export const OG_IMAGE_SIZE = { width: 1560, height: 819 } as const;
export const OG_IMAGE_SIZE_LABEL = `${OG_IMAGE_SIZE.width}×${OG_IMAGE_SIZE.height}`;

/** Shared images are regenerated after this many days. */
export const GLOBAL_IMAGE_TTL_DAYS = 30;
export const GLOBAL_IMAGE_TTL_MS = GLOBAL_IMAGE_TTL_DAYS * DAY_MS;
