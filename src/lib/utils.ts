import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SSR and hydration must produce the same string, so the timezone is fixed
 * and the string is built from parts: some browsers' `toLocaleString` puts a
 * narrow no-break space before AM/PM where workerd uses a plain space.
 */
export function formatDate(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.month} ${values.day}, ${values.year}, ${values.hour}:${values.minute}:${values.second} ${values.dayPeriod}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/** "just now", "5m ago", "3h ago", "12d ago", then a date. */
export function formatRelativeTime(
  timestamp: number,
  now = Date.now(),
): string {
  const diffMinutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
