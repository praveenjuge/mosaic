import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { website_url } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBytes(input: string): number | null {
  console.log(input);
  if (!input) return null;
  const units = {
    B: 1,
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
