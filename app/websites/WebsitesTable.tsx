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
import { createClient } from "@/lib/supabase/server";
import { WebsiteNew } from "@/lib/types";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Globe } from "@mynaui/icons-react";
import Link from "next/link";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export default async function WebsitesTable() {
  const client = await createClient();
  const { userId } = await auth();

  if (!userId) {
    return <p>Please sign in to view your websites.</p>;
  }

  const { data, error } = await client
    .from("websites_new")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
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
                {data.map((website: WebsiteNew) => (
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
                    <TableCell>0</TableCell>
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
