"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { curveCardinal } from "d3-shape";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function MosaicAreaChart({ page_hits }: { page_hits: any }) {
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
      <AreaChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          hide={true}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
          // tick={{ angle: -15, textAnchor: 'end', dx: 25 }}
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
        <Area
          type={cardinal}
          dataKey="total_hits"
          stroke="#07976a"
          fill="#07976a"
          fillOpacity={0.3}
          hide={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
