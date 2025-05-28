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
import { SignedIn } from "@clerk/nextjs";
import { Globe } from "@mynaui/icons-react";
import Link from "next/link";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

// Define a type for the website object
type Website = {
  id: string;
  favicon_url?: string;
  is_duplicate?: boolean;
  title?: string;
  website_url: string;
  cleaned_website_url: string;
  total_count: number;
};

export default async function WebsitesTable() {
  const client = await createClient();
  const { data, error } = await client
    .from("websites")
    .select("*")
    .order("id", { ascending: true });

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
                {data.map((website: Website) => (
                  <TableRow key={website.id}>
                    <TableCell className="flex items-center gap-2">
                      {website.favicon_url
                        ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={website.favicon_url}
                            className="size-4"
                            alt={website.title
                              ? website.title
                              : website.website_url}
                            width={16}
                            height={16}
                          />
                        )
                        : <Globe className="size-4" />}
                      <Link
                        href={`/websites/${website.id}`}
                        className="max-w-xs truncate font-medium text-primary"
                      >
                        {website.title
                          ? website.title
                          : website.cleaned_website_url}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="max-w-lg items-center truncate font-medium">
                          {`${website_url}use?url=https://${website.cleaned_website_url}`}
                        </span>
                        <CopyButton
                          text={`${website_url}use?url=https://${website.cleaned_website_url}`}
                        />
                      </div>
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
