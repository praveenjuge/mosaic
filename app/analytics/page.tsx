import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Metadata } from "next";
import { ImagesChart } from "./imageschart";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your logs and analytics here.",
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>59,623</CardTitle>
            <CardDescription>Images Generated</CardDescription>
            <Progress className="h-2" value={33} />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>18 GB/20 GB</CardTitle>
            <CardDescription>Storage Used</CardDescription>
            <Progress className="h-2" value={66} />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>114,431</CardTitle>
            <CardDescription>Times Viewed</CardDescription>
            <Progress className="h-2" value={77} />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images Generated</CardTitle>
          <CardDescription>
            Showing total images generated last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImagesChart />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Screenshots History</CardTitle>
          <CardDescription>
            {/* TODO */}
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
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time to Render</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <img src="#" alt="Screenshot" className="h-6 w-10 rounded" />
                </TableCell>
                <TableCell>harvard.edu</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>546 ms</TableCell>
                <TableCell>3 Mb</TableCell>
                <TableCell>Dec 4, 2019 21:42</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img src="#" alt="Screenshot" className="h-6 w-10 rounded" />
                </TableCell>
                <TableCell>usp.br</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>54 ms</TableCell>
                <TableCell>180 kb</TableCell>
                <TableCell>Mar 20, 2019 23:14</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img src="#" alt="Screenshot" className="h-6 w-10 rounded" />
                </TableCell>
                <TableCell>u-tokyo.ac.jp</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>457 ms</TableCell>
                <TableCell>18 Mb</TableCell>
                <TableCell>Dec 30, 2019 07:52</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img src="#" alt="Screenshot" className="h-6 w-10 rounded" />
                </TableCell>
                <TableCell>stanford.edu</TableCell>
                <TableCell>Failed</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>Feb 2, 2019 19:28</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <img src="#" alt="Screenshot" className="h-6 w-10 rounded" />
                </TableCell>
                <TableCell>du.ac.in</TableCell>
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
