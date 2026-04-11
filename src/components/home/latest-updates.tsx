import type { ChangelogEntry } from "@/lib/content";

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface LatestUpdatesProps {
  entries: ChangelogEntry[];
}

export default function LatestUpdates({ entries }: LatestUpdatesProps) {
  const recentEntries = entries.slice(0, 10);

  return (
    <section id="latest-updates" className="mx-auto max-w-4xl pt-8">
      <div className="mb-5 md:text-center">
        <h2 className="mb-2 text-2xl font-semibold tracking-tighter md:text-3xl">
          Latest Updates
        </h2>
        <p className="text-muted-foreground text-base">
          What&apos;s new with Mosaic
        </p>
      </div>
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        {recentEntries.map((entry) => (
          <div
            key={entry.slug}
            className="flex items-center justify-between gap-3 border-b border-border py-2"
          >
            <h3 className="min-w-0 text-sm font-medium">{entry.title}</h3>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatDate(entry.publishedAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
