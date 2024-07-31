"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, Legend, Line, ComposedChart } from "recharts";

export function ImagesChart({ page_hits }: { page_hits: any }) {
  let data: any[] = []
  if (page_hits) {
    data = Object.keys(page_hits).map((date) => ({
      time: date,
      total_hits: page_hits[date],
    }));
  }
  return (
    <ChartContainer className="h-44 w-full pb-10" config={{}}>
      <ComposedChart
        data={data}
        margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
      >
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
        <Legend wrapperStyle={{ paddingTop: '15px' }} />

        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        {/* <Bar dataKey="total_hits" fill="#07976a" /> */}
        <Line type="monotone" dataKey="total_hits" stroke="#07976a" />
      </ComposedChart>
    </ChartContainer>
  );
}
