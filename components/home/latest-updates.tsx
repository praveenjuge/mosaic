function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ChangelogEntry {
  title: string;
  slug: string;
  publishedAt: Date | string;
}

interface LatestUpdatesProps {
  entries: ChangelogEntry[];
}

export default function LatestUpdates({ entries }: LatestUpdatesProps) {
  const recentEntries = entries.slice(0, 3);

  return (
    <section id="latest-updates" className="mx-auto max-w-4xl pt-10">
      <div className="mb-8 md:text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tighter">
          Latest Updates
        </h2>
        <p className="text-muted-foreground text-lg">
          What&apos;s new with Mosaic
        </p>
      </div>
      <div className="space-y-4">
        {recentEntries.map((entry) => (
          <div
            key={entry.slug}
            className="flex items-center justify-between border-b border-border pb-4 last:border-0"
          >
            <h3 className="font-medium">{entry.title}</h3>
            <span className="text-muted-foreground text-sm">
              {formatDate(entry.publishedAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
