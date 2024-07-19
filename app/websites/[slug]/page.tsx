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
import { createClient } from "@/lib/supabase/server";
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

export default async function Page({ params }: { params: { slug: string } }) {
  const client = await createClient();
  const { data: websites, error } = await client
    .from("websites")
    .select("*")
    .eq("id", params.slug);

  console.log(websites);

  if (error || websites.length === 0) {
    notFound();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <CardHeader className="p-0">
          <CardDescription>
            <Link href="/websites">← Back</Link>
          </CardDescription>
          <CardTitle>{websites[0].cleaned_website_url}</CardTitle>
        </CardHeader>
        <Button variant="outline">Edit</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{websites[0].total_count}</CardTitle>
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
            <CardTitle>2 GB</CardTitle>
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
                <TableHead>Image</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time to Render</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <img
                    src="/placeholder.svg"
                    alt="Screenshot"
                    className="h-10 w-10"
                  />
                </TableCell>
                <TableCell>https://praveenjuge.com/bL...</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>546 ms</TableCell>
                <TableCell>3 Mb</TableCell>
                <TableCell>Dec 4, 2019 21:42</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img
                    src="/placeholder.svg"
                    alt="Screenshot"
                    className="h-10 w-10"
                  />
                </TableCell>
                <TableCell>https://praveenjuge.com/bL...</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>54 ms</TableCell>
                <TableCell>180 kb</TableCell>
                <TableCell>Mar 20, 2019 23:14</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img
                    src="/placeholder.svg"
                    alt="Screenshot"
                    className="h-10 w-10"
                  />
                </TableCell>
                <TableCell>https://praveenjuge.com/bL...</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>457 ms</TableCell>
                <TableCell>18 Mb</TableCell>
                <TableCell>Dec 30, 2019 07:52</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img
                    src="/placeholder.svg"
                    alt="Screenshot"
                    className="h-10 w-10"
                  />
                </TableCell>
                <TableCell>https://praveenjuge.com/bL...</TableCell>
                <TableCell>Failed</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>Feb 2, 2019 19:28</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img
                    src="/placeholder.svg"
                    alt="Screenshot"
                    className="h-10 w-10"
                  />
                </TableCell>
                <TableCell>https://praveenjuge.com/bL...</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>457 ms</TableCell>
                <TableCell>19 Kb</TableCell>
                <TableCell>Dec 30, 2019 05:18</TableCell>
              </TableRow>
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
