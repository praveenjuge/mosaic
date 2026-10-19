import { formatDate, formatRelativeTime } from "@/lib/utils";

/**
 * "5m ago", with the exact time on hover. The server and the browser can
 * render it a minute apart, so a mismatch here is expected and harmless.
 */
export function RelativeTime({ timestamp }: { timestamp: number }) {
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      title={formatDate(timestamp)}
      suppressHydrationWarning
    >
      {formatRelativeTime(timestamp)}
    </time>
  );
}
