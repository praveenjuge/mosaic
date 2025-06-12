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
import Image from "next/image";
import { WebsiteActions } from "./WebsiteActions";
import { WebsiteInfoModal } from "./WebsiteInfoModal";

export default async function WebsitesTable() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await getAllWebsitesWithStats();

  if (!data) {
    return <p>Error loading websites. Please try again.</p>;
  }

  return (
    <SignedIn>
      <Card className="p-0">
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>OG Images</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((website) => (
                <TableRow key={website.id} className="items-center">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={`https://www.google.com/s2/favicons?domain=https://${website.url_base}&sz=64`}
                        alt="Favicon"
                        className="size-3.5"
                        width={14}
                        height={14}
                      />
                      <a
                        href={`https://${website.url_base}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary max-w-xs truncate font-medium"
                      >
                        {website.url_base}
                      </a>
                    </div>
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
                  <TableCell>
                    {website.screenshot_count === 0 ? (
                      <WebsiteInfoModal websiteUrl={website.url_base} />
                    ) : (
                      website.screenshot_count
                    )}
                  </TableCell>
                  <TableCell>
                    <WebsiteActions
                      websiteId={website.id}
                      currentUrl={website.url_base}
                      hasImages={website.screenshot_count > 0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardHeader className="py-6">
            <CardTitle>No websites yet</CardTitle>
            <CardDescription>Add a new website to get started.</CardDescription>
          </CardHeader>
        )}
      </Card>
    </SignedIn>
  );
}
