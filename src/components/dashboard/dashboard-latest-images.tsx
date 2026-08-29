import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { DashboardStats } from "@/lib/types";
import { buildPublicImageUrl, cleanDisplayUrl } from "@/lib/url";
import { formatDate } from "@/lib/utils";

function ScreenshotsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No OG Images found</CardTitle>
        <CardDescription>
          OG Images will appear here once a page on your website is requested.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function DashboardLatestImages({
  latestScreenshots,
}: {
  latestScreenshots: DashboardStats["latest_screenshots"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <CardHeader className="p-0">
        <CardTitle>Latest OG Images</CardTitle>
      </CardHeader>
      {latestScreenshots.length === 0 ? (
        <ScreenshotsEmpty />
      ) : (
        <Card className="p-0">
          <Table>
            <TableBody>
              {latestScreenshots.map((item) => {
                const screenshotUrl = buildPublicImageUrl(item.key);
                const displayUrl = cleanDisplayUrl(item.page_url);

                return (
                  <TableRow key={item.key}>
                    <TableCell className="py-0">
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={screenshotUrl}
                        className="block w-12 shrink-0"
                      >
                        <img
                          src={screenshotUrl}
                          alt={`OG image for ${item.page_url}`}
                          className="h-6 w-12 shrink-0 rounded border bg-cover bg-center object-cover"
                          width={56}
                          height={24}
                          loading="lazy"
                        />
                      </a>
                    </TableCell>
                    <TableCell>
                      <a
                        href={item.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block max-w-xs truncate font-medium hover:underline"
                      >
                        {displayUrl}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {item.url_base}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(item.generated_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
