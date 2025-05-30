import { CopyButton } from "@/components/copy-button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { website_url } from "@/lib/constants";
import { getAllWebsitesWithStats } from "@/lib/database-helpers";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Globe } from "@mynaui/icons-react";
import Link from "next/link";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export default async function WebsitesTable() {
  const { userId } = await auth();

  if (!userId) {
    return <p>Please sign in to view your websites.</p>;
  }

  const data = await getAllWebsitesWithStats(userId);

  if (!data) {
    return <p>Error loading websites. Please try again.</p>;
  }

  return (
    <SignedIn>
      <Card className="p-0">
        {data.length > 0
          ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <Link
                        href={`/websites/${website.id}`}
                        className="max-w-xs truncate font-medium text-primary"
                      >
                        {website.site_name || website.url_base}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="max-w-lg items-center truncate font-medium">
                          {`${website_url}use?url=https://${website.url_base}`}
                        </span>
                        <CopyButton
                          text={`${website_url}use?url=https://${website.url_base}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{website.screenshot_count}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <EditWebsite
                        websiteId={website.id}
                        currentUrl={website.url_base}
                      />
                      <span>•</span>
                      <DeleteWebsite websiteId={website.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
          : (
            <CardHeader className="py-6">
              <CardTitle>No websites yet</CardTitle>
              <CardDescription>
                Add a new website to get started.
              </CardDescription>
            </CardHeader>
          )}
      </Card>
    </SignedIn>
  );
}
