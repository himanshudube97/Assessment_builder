'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface SourceChartProps {
  data: { source: string; count: number }[];
}

const SOURCE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function SourceChart({ data }: SourceChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((d, i) => {
      config[d.source.toLowerCase().replace(/[^a-z0-9]/g, '_')] = {
        label: d.source,
        color: SOURCE_COLORS[i % SOURCE_COLORS.length],
      };
    });
    return config;
  }, [data]);

  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        name: d.source.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        value: d.count,
        fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
      })),
    [data]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Traffic Sources
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Where respondents come from
      </p>
      <ChartContainer config={chartConfig} className="mx-auto h-[220px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={80}
            strokeWidth={2}
            stroke="var(--color-background, #fff)"
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-slate-900 dark:fill-slate-100 text-2xl font-bold"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 20}
                        className="fill-slate-500 text-xs"
                      >
                        total
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
