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
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Earth, Globe } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
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
      <div className="flex items-center justify-between">
        <CardHeader className="p-0">
          <CardTitle>{metadata.title as string}</CardTitle>
          <CardDescription>{metadata.description}</CardDescription>
        </CardHeader>
        <SignedIn>
          <AddWebsite />
        </SignedIn>
      </div>
      <SignedOut>
        <div className="flex w-full flex-col items-center justify-center rounded border-[0.5px] bg-primary-foreground px-4 py-20 text-center">
          <div className="mx-auto rounded-full border-[0.5px] bg-background p-2">
            <Earth className="size-6" />
          </div>
          <h3 className="mb-1 mt-2 text-sm font-medium">
            Add your websites here
          </h3>
          <p className="mb-4 text-balance text-sm text-muted-foreground">
            When you add a website you will get a special URL to get your OG
            Images for that website.
          </p>
        </div>
      </SignedOut>
      <SignedIn>
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
                          className="max-w-xs truncate font-medium"
                        >
                          {website.title ? website.title : website.website_url}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">
                      {website.cleaned_website_url}
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
      </SignedIn>
    </>
  );
}
