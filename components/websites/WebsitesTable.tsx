import { CopyButton } from "@/components/copy-button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { website_url } from "@/lib/constants";
import { getAllWebsitesWithStats } from "@/lib/db";
import { SiteWithStats } from "@/lib/types";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { Suspense } from "react";
import { WebsiteActions } from "./WebsiteActions";
import { WebsiteInfoModal } from "./WebsiteInfoModal";

// Loading skeleton for table
function WebsitesTableSkeleton() {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5 rounded-sm" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="size-4" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Error state component
function WebsitesError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Loading Websites</CardTitle>
        <CardDescription>
          Unable to fetch websites from the database.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

// Empty state component
function WebsitesEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No websites added yet</CardTitle>
        <CardDescription>
          Add your first website to start generating OG images.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

// Website table row component
function WebsiteRow({ website }: { website: SiteWithStats }) {
  return (
    <TableRow className="items-center">
      <TableCell>
        <div className="flex items-center gap-2">
          <Suspense fallback={<Skeleton className="size-3.5 rounded-sm" />}>
            <Image
              src={`https://www.google.com/s2/favicons?domain=https://${website.url_base}&sz=64`}
              alt="Favicon"
              className="size-3.5"
              width={14}
              height={14}
            />
          </Suspense>
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
          <Suspense fallback={<Skeleton className="size-4" />}>
            <CopyButton
              text={`${website_url}use?url=https://${website.url_base}`}
            />
          </Suspense>
        </div>
      </TableCell>
      <TableCell>
        {website.screenshot_count === 0 ? (
          <Suspense fallback={<Skeleton className="h-6 w-16" />}>
            <WebsiteInfoModal websiteUrl={website.url_base} />
          </Suspense>
        ) : (
          website.screenshot_count
        )}
      </TableCell>
      <TableCell className="flex items-center p-0.5">
        <Suspense fallback={<Skeleton className="h-8 w-16" />}>
          <WebsiteActions
            websiteId={website.id}
            currentUrl={website.url_base}
            hasImages={website.screenshot_count > 0}
          />
        </Suspense>
      </TableCell>
    </TableRow>
  );
}

// Websites table component
function WebsitesTableContent({ data }: { data: SiteWithStats[] }) {
  return (
    <Card className="p-0">
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
            <WebsiteRow key={website.id} website={website} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Main websites content component
async function WebsitesContent() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await getAllWebsitesWithStats();

  if (!data) {
    return <WebsitesError />;
  }

  if (data.length === 0) {
    return <WebsitesEmpty />;
  }

  return <WebsitesTableContent data={data} />;
}

export default function WebsitesTable() {
  return (
    <SignedIn>
      <Suspense fallback={<WebsitesTableSkeleton />}>
        <WebsitesContent />
      </Suspense>
    </SignedIn>
  );
}
