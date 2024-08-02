"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { curveCardinal } from "d3-shape";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

export function MosaicBarChart({ page_hits }: { page_hits: any }) {
  let data: any[] = [];
  const cardinal = curveCardinal.tension(0.2);
  if (page_hits) {
    data = Object.keys(page_hits).map((date) => ({
      time: date,
      total_hits: page_hits[date],
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
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="total_hits"
          fill="#07976a"
          fillOpacity={0.8}
        />
      </BarChart>
    </ChartContainer>
  );
}
