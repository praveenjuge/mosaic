import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { website_url } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBytes(input: string): number | null {
  if (!input) return null;
  const units = {
    B: 1,
    BYTES: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
    EB: 1024 ** 6,
    ZB: 1024 ** 7,
    YB: 1024 ** 8,
  };

  const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/;
  const match = input.match(regex);

  if (!match) throw new Error("Invalid input format");

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (!(unit in units)) throw new Error("Unknown unit");

  return value * (units as Record<string, number>)[unit];
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
  return `${website_url}use?url=https://mosaicimg.com/${slug}`;
}

/**
 * Centralized URL cleaning function to ensure consistency across the application
 * Returns just the hostname without protocol (e.g., "example.com")
 */
export function cleanUrl(url: string): string {
  if (!url) return "";

  // Remove whitespace
  url = url.trim();

  try {
    // Try parsing as-is first
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    try {
      // If parsing fails, try adding https:// protocol
      const urlWithProtocol =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      const parsedUrl = new URL(urlWithProtocol);
      return parsedUrl.hostname;
    } catch {
      // If parsing still fails, attempt to extract domain using regex
      const domainMatch = url.match(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/,
      );
      return domainMatch ? domainMatch[1] : url;
    }
  }
}

/**
 * Extract URL parts consistently for database storage
 * urlBase will always be just the hostname (e.g., "example.com")
 */
export function extractUrlPartsConsistent(fullUrl: string): {
  urlBase: string;
  path: string;
  hostname: string;
} {
  try {
    const parsedUrl = new URL(fullUrl);
    return {
      urlBase: parsedUrl.hostname, // Just hostname, no protocol
      path: parsedUrl.pathname + parsedUrl.search + parsedUrl.hash,
      hostname: parsedUrl.hostname,
    };
  } catch {
    // Fallback for malformed URLs
    const cleaned = cleanUrl(fullUrl);
    return {
      urlBase: cleaned,
      path: "/",
      hostname: cleaned,
    };
  }
}
