'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ResponseTimelineProps {
  data: { date: string; count: number }[];
}

const chartConfig = {
  responses: {
    label: 'Responses',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ResponseTimeline({ data }: ResponseTimelineProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatDate(d.date) })),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Response Timeline
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
          No response data yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Response Timeline
      </h3>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="fillResponses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs fill-slate-500"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
            className="text-xs fill-slate-500"
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Area
            dataKey="count"
            name="responses"
            type="monotone"
            fill="url(#fillResponses)"
            stroke="var(--chart-1)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
