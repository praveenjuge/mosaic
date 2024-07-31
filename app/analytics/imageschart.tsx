"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, Legend, Line, AreaChart, Area } from "recharts";
import { curveCardinal } from 'd3-shape';


export function ImagesChart({ page_hits }: { page_hits: any }) {
  page_hits = {
    "2024-07-02": 10,
    "2024-07-03": 30,
    "2024-07-04": 20,
    "2024-07-05": 10,
    "2024-07-06": 15,
    "2024-07-07": 20,
    "2024-07-08": 15,
    "2024-07-09": 25,
    "2024-07-10": 30,
    "2024-07-11": 25,
    "2024-07-12": 30,
    "2024-07-13": 25,
    "2024-07-14": 20,
    "2024-07-15": 15,
    "2024-07-16": 10,
    "2024-07-17": 85,
    "2024-07-18": 80,
    "2024-07-19": 125,
    "2024-07-20": 100,
    "2024-07-21": 150,
    "2024-07-22": 100,
    "2024-07-23": 125,
    "2024-07-24": 100,
    "2024-07-25": 12,
    "2024-07-26": 6,
    "2024-07-27": 10,
    "2024-07-28": 15,
    "2024-07-29": 10,
    "2024-07-30": 15,
    "2024-07-31": 10
  }
  let data: any[] = []
  const cardinal = curveCardinal.tension(0.2);
  if (page_hits) {
    data = Object.keys(page_hits).map((date) => ({
      time: date,
      total_hits: page_hits[date],
    }));
  }
  return (
    <ChartContainer className="h-44 w-full" config={{}}>
      <AreaChart
        data={data}
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
          content={<ChartTooltipContent hideLabel />}
        />
        <Area type={cardinal} dataKey="total_hits" stroke="#07976a" fill="#07976a" fillOpacity={0.3} hide={false} />
      </AreaChart>
    </ChartContainer>
  );
}
