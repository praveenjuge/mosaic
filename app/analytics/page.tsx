"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoCircle, InfoTriangle, TrendingUp } from "@mynaui/icons-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>Anaytics</CardTitle>
        <CardDescription>TODO: View all logs and analytics</CardDescription>
      </CardHeader>
      <div className="grid w-full gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Screenshot Volume</CardTitle>
            <CardDescription>
              Total number of screenshots captured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-4xl font-semibold tracking-tight">12,345</h3>
            <p className="mt-1 text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
            <CardDescription>
              Percentage of screenshots successfully captured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-4xl font-semibold tracking-tight">92%</h3>
            <p className="mt-1 text-muted-foreground">+3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>
              Total number of users interacting with the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-4xl font-semibold tracking-tight">8,765</h3>
            <p className="mt-1 text-muted-foreground">+10% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Screenshot Volume</CardTitle>
            <CardDescription>
              Visualize the trend of screenshot volume over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinechartChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
            <CardDescription>
              Trend of screenshot success rate over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarchartChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>
              Visualize the trend of user engagement over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinechartChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Websites</CardTitle>
            <CardDescription>
              List of websites with the highest screenshot volume and success
              rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Screenshots</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Link href="#">example.com</Link>
                  </TableCell>
                  <TableCell>2,345</TableCell>
                  <TableCell>98%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Link href="#">acme.com</Link>
                  </TableCell>
                  <TableCell>1,876</TableCell>
                  <TableCell>92%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Link href="#">widgets.com</Link>
                  </TableCell>
                  <TableCell>1,543</TableCell>
                  <TableCell>89%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Link href="#">blog.com</Link>
                  </TableCell>
                  <TableCell>1,234</TableCell>
                  <TableCell>85%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Link href="#">news.com</Link>
                  </TableCell>
                  <TableCell>987</TableCell>
                  <TableCell>92%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
            <CardDescription>
              List of errors encountered during screenshot capture, along with
              their occurrences and last seen time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error</TableHead>
                  <TableHead>Occurrences</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InfoTriangle className="size-5 text-red-500" />
                      <span className="font-medium">Timeout</span>
                    </div>
                  </TableCell>
                  <TableCell>345</TableCell>
                  <TableCell>2 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InfoCircle className="size-5 text-yellow-500" />
                      <span className="font-medium">Network Error</span>
                    </div>
                  </TableCell>
                  <TableCell>234</TableCell>
                  <TableCell>4 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InfoTriangle className="size-5 text-red-500" />
                      <span className="font-medium">Rendering Error</span>
                    </div>
                  </TableCell>
                  <TableCell>167</TableCell>
                  <TableCell>6 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InfoCircle className="size-5 text-yellow-500" />
                      <span className="font-medium">Unsupported Browser</span>
                    </div>
                  </TableCell>
                  <TableCell>89</TableCell>
                  <TableCell>8 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InfoTriangle className="size-5 text-red-500" />
                      <span className="font-medium">Unauthorized Access</span>
                    </div>
                  </TableCell>
                  <TableCell>45</TableCell>
                  <TableCell>12 hours ago</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>
              Highlights and insights related to screenshot volume, success
              rate, and user engagement.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              <div>
                <p className="font-medium">Screenshot Volume Increased</p>
                <p className="text-muted-foreground">
                  Screenshot volume increased by 15% compared to last month.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              <div>
                <p className="font-medium">Success Rate Improved</p>
                <p className="text-muted-foreground">
                  Screenshot success rate increased by 3% compared to last
                  month.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              <div>
                <p className="font-medium">User Engagement Grew</p>
                <p className="text-muted-foreground">
                  User engagement increased by 10% compared to last month.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BarchartChart() {
  return (
    <div>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <BarChart
          accessibilityLayer
          data={[
            { month: "January", desktop: 186 },
            { month: "February", desktop: 305 },
            { month: "March", desktop: 237 },
            { month: "April", desktop: 73 },
            { month: "May", desktop: 209 },
            { month: "June", desktop: 214 },
          ]}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function LinechartChart() {
  return (
    <div>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart
          accessibilityLayer
          data={[
            { month: "January", desktop: 186 },
            { month: "February", desktop: 305 },
            { month: "March", desktop: 237 },
            { month: "April", desktop: 73 },
            { month: "May", desktop: 209 },
            { month: "June", desktop: 214 },
          ]}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="desktop"
            type="natural"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
