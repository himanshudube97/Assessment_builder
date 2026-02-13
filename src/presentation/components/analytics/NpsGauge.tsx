'use client';

import { useMemo } from 'react';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface NpsGaugeProps {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  distribution: Record<string, number>;
}

const chartConfig = {
  count: {
    label: 'Responses',
  },
} satisfies ChartConfig;

function getNpsColor(score: number): string {
  if (score >= 50) return 'text-emerald-500';
  if (score >= 0) return 'text-amber-500';
  return 'text-red-500';
}

function getNpsLabel(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Great';
  if (score >= 0) return 'Good';
  if (score >= -50) return 'Needs Work';
  return 'Critical';
}

function getBarColor(value: number): string {
  if (value <= 6) return 'var(--color-destructive, #ef4444)';
  if (value <= 8) return 'var(--chart-4)';
  return 'var(--color-emerald-500, #10b981)';
}

export function NpsGauge({
  score,
  promoters,
  passives,
  detractors,
  total,
  distribution,
}: NpsGaugeProps) {
  const distributionData = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        value: String(i),
        count: distribution[String(i)] || 0,
      })),
    [distribution]
  );

  const promoterPct = Math.round((promoters / total) * 100);
  const passivePct = Math.round((passives / total) * 100);
  const detractorPct = Math.round((detractors / total) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
        NPS Score
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Net Promoter Score
      </p>

      {/* Score display */}
      <div className="text-center mb-5">
        <span className={cn('text-5xl font-bold', getNpsColor(score))}>
          {score > 0 ? `+${score}` : score}
        </span>
        <p className={cn('text-sm font-medium mt-1', getNpsColor(score))}>
          {getNpsLabel(score)}
        </p>
      </div>

      {/* Stacked bar */}
      <div className="mb-4">
        <div className="flex h-4 rounded-full overflow-hidden">
          {detractorPct > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${detractorPct}%` }}
            />
          )}
          {passivePct > 0 && (
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${passivePct}%` }}
            />
          )}
          {promoterPct > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${promoterPct}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Detractors {detractorPct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Passives {passivePct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Promoters {promoterPct}%
          </span>
        </div>
      </div>

      {/* Distribution bar chart */}
      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <BarChart data={distributionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="value"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            className="text-xs fill-slate-500"
          />
          <YAxis hide allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {distributionData.map((entry) => (
              <Cell key={entry.value} fill={getBarColor(Number(entry.value))} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
