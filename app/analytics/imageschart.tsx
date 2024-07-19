"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

export function ImagesChart() {
  return (
    <ChartContainer
      className="h-44 w-full"
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
  );
}
