import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { InfoTriangle, Globe, CheckCircleOne } from "@mynaui/icons-react";
import Link from "next/link";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export default async function WebsitesTable() {
  const client = await createClient();
  const { data: websites, error } = await client.from("websites").select("*");

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Website</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Cache</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.length > 0 ? (
            websites.map((website) => (
              <TableRow key={website.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {website.favicon_url ? (
                      <img src={website.favicon_url} className="size-4" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                    <Link
                      href={`/websites/${website.id}`}
                      className="max-w-xs truncate font-medium text-primary"
                    >
                      {website.title ? website.title : website.website_url}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate font-medium">
                  <div className="flex items-center gap-2">
                    {website.is_duplicate ? (
                      <InfoTriangle className=""></InfoTriangle>) : (
                      <CheckCircleOne className="text-primary"></CheckCircleOne>
                    )
                    }
                    {website.cleaned_website_url}
                  </div>
                </TableCell>
                <TableCell>{website.total_count}</TableCell>
                <TableCell>
                  {/* TODO */}
                  30 Days
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <EditWebsite
                      websiteId={website.id}
                      currentUrl={website.website_url}
                    />
                    <span>•</span>
                    <DeleteWebsite websiteId={website.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No websites found. Add a new website to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
