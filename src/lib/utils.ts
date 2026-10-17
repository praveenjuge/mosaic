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
