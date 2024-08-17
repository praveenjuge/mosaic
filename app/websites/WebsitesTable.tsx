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
import { Globe, InfoTriangle } from "@mynaui/icons-react";
import Link from "next/link";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export default async function WebsitesTable() {
  const client = await createClient();
  const { data, error } = await client.from("websites").select("*");

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
  }

  return (
    <Card>
      {data.length > 0 ? (
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
            {data.map((website: any) => (
              <TableRow key={website.id}>
                <TableCell className="flex items-center gap-2">
                  {website.favicon_url ? (
                    <img src={website.favicon_url} className="size-4" />
                  ) : (
                    <Globe className="size-4" />
                  )}
                  {website.is_duplicate ? (
                    <InfoTriangle className="size-4"></InfoTriangle>
                  ) : (
                    ""
                  )}
                  <Link
                    href={`/websites/${website.id}`}
                    className="max-w-xs truncate font-medium text-primary"
                  >
                    {website.title ? website.title : website.website_url}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs truncate font-medium">
                  {`${website_url}use?url=https://${website.cleaned_website_url}`}
                </TableCell>
                <TableCell>{website.total_count}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <EditWebsite
                    websiteId={website.id}
                    currentUrl={website.website_url}
                  />
                  <span>•</span>
                  <DeleteWebsite websiteId={website.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CardHeader>
          <CardTitle>No websites yet</CardTitle>
          <CardDescription>Add a new website to get started.</CardDescription>
        </CardHeader>
      )}
    </Card>
  );
}
