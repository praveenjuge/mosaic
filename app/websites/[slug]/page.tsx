import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { ExternalLink } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: params.slug,
  };
}

async function fetchWebsiteData(token: string, websiteId: string) {
  const url = "https://get.mosaicimg.com/api/websites/" + websiteId;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export default async function Page({ params }: { params: { slug: string } }) {
  let data: any = {};
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      const response = await fetchWebsiteData(token, params.slug);
      data = response;
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return (
    <>
      <CardHeader className="p-0">
        <CardDescription>
          <Link href="/websites">← Back</Link>
        </CardDescription>
        <CardTitle>
          {data.cleaned_website_url}

        </CardTitle>
      </CardHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{data.total_count}</CardTitle>
            <CardDescription>Images</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>30 Days</CardTitle>
            <CardDescription>Cache Days</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatBytes(data.total_bytes)}</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Latest Screenshots</CardTitle>
          <CardDescription>
            Condimentum nulla pellentesque eget feugiat sit blandit vitae
            pellentesque nulla. Tempor hendrerit tincidunt nunc arcu
            pellentesque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>Image</TableHead> */}
                <TableHead>URL</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last refreshed at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.website_pages.map((website_page: any) => (
                <TableRow key={website_page.id}>
                  {/* <TableCell>
                    <img
                      src={"https://ddvbpf2rl5x5r.cloudfront.net/" + website_page.image_key}
                      alt={website_page.title}
                      className="size-16"
                    />
                  </TableCell> */}
                  <TableCell>


                    <div className="flex items-center gap-2">
                      <Link
                        href={"https://ddvbpf2rl5x5r.cloudfront.net/" + website_page.image_key}
                        className="max-w-xs truncate font-medium text-primary"
                      >
                        <ExternalLink className="h-4 w-4"></ExternalLink>
                      </Link>
                      {website_page.title ? website_page.title : website_page.website_page_url}
                    </div>
                  </TableCell>
                  {/* <TableCell>{website_page.page_url}</TableCell> */}
                  <TableCell>{website_page.title}</TableCell>
                  <TableCell>{formatBytes(website_page.size_in_bytes)}</TableCell>
                  <TableCell>
                    {new Date(website_page.updated_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Previous</Button>
          <Button variant="outline">Next</Button>
        </CardFooter>
      </Card>
    </>
  );
}
