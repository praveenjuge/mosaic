"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function MosaicBarChart({
  datapoints,
  datakey,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datapoints: any;
  datakey: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any[] = [];
  if (datapoints) {
    data = Object.keys(datapoints).map((date) => ({
      time: date,
      [datakey]: datapoints[date],
    }));
  }
  return (
    <ChartContainer className="h-44 w-full" config={{}}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          hide={true}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
          tickLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={2}
          allowDataOverflow={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey={datakey} fill="#07976a" fillOpacity={0.8} />
      </BarChart>
    </ChartContainer>
  );
}
