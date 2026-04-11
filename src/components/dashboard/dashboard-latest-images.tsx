import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { DashboardStats } from "@/convex/stats";

function ScreenshotsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No OG Images found</CardTitle>
        <CardDescription>
          OG Images will appear here once you visit pages on your website.
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
              {latestScreenshots.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-0">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={item.screenshot_url}
                      className="block w-12 shrink-0"
                    >
                      <img
                        src={item.screenshot_url}
                        alt={item.page_url || "Screenshot"}
                        className="h-6 w-12 shrink-0 rounded border-[0.5px] bg-cover bg-center object-cover"
                        width={56}
                        height={24}
                      />
                    </a>
                  </TableCell>
                  <TableCell>
                    {item.page_url ? (
                      <a
                        href={item.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary max-w-xs truncate font-medium hover:underline"
                      >
                        {item.display_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        Unknown page
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {item.website_name ?? "Unknown website"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {item.formatted_date}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
