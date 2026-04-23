/**
 * Shared formatting utilities.
 *
 * Pure functions with no backend dependencies — safe to use anywhere.
 */

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

export function formatLimit(limit: number): string {
  return limit >= 999999 ? "∞" : formatNumber(limit);
}
