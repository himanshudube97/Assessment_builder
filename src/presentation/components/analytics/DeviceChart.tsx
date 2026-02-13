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

interface DeviceChartProps {
  data: { device: string; count: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  Desktop: 'var(--chart-1)',
  Mobile: 'var(--chart-2)',
  Tablet: 'var(--chart-4)',
};

export function DeviceChart({ data }: DeviceChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((d) => {
      config[d.device.toLowerCase()] = {
        label: d.device,
        color: DEVICE_COLORS[d.device] || 'var(--chart-5)',
      };
    });
    return config;
  }, [data]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: d.device.toLowerCase(),
        value: d.count,
        fill: DEVICE_COLORS[d.device] || 'var(--chart-5)',
      })),
    [data]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Devices
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Respondent devices
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
