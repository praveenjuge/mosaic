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
import { createClient } from "@/lib/supabase/server";
import { SignedIn } from "@clerk/nextjs";
import { Globe } from "@mynaui/icons-react";
import { Metadata } from "next";
import { AddWebsite } from "./AddWebsite";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export const metadata: Metadata = {
  title: "Websites",
  description: "Add, edit or remove websites here.",
};

export default async function Page() {
  const client = await createClient();
  const { data: websites, error } = await client.from("websites").select("*");

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
  }

  return (
    <>
      <div className="flex justify-between">
        <CardHeader className="p-0">
          <CardTitle>{metadata.title as string}</CardTitle>
          <CardDescription>{metadata.description}</CardDescription>
        </CardHeader>
        <AddWebsite />
      </div>
      <SignedIn>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Cache Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {website.favicon_url ? (
                        <img src={website.favicon_url} className="size-5" />
                      ) : (
                        <Globe className="size-5" />
                      )}
                      <span className="max-w-xs truncate font-medium">
                        {website.title ? website.title : website.website_url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{website.website_url}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </Card>
      </SignedIn>
    </>
  );
}
