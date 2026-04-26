import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { publicEnv } from "./env";
import { buildSiteOgImageUrl } from "./platform";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getOgImageUrl(slug: string) {
  const normalizedSlug = slug.replace(/^\//, "");
  const targetUrl = new URL(normalizedSlug, publicEnv.siteUrl).toString();

  return buildSiteOgImageUrl(publicEnv.siteUrl, targetUrl);
}
