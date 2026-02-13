'use client';

/**
 * AnswerChart Component
 * Horizontal bar chart showing answer distribution for a question
 */

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface AnswerChartProps {
  questionText: string;
  questionType: string;
  distribution: Record<string, number>;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice_single: 'Single Choice',
  multiple_choice_multi: 'Multiple Choice',
  short_text: 'Short Text',
  long_text: 'Long Text',
  rating: 'Rating',
  yes_no: 'Yes/No',
  number: 'Number',
  email: 'Email',
  dropdown: 'Dropdown',
  date: 'Date',
  nps: 'NPS',
};

const BAR_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const chartConfig = {
  count: {
    label: 'Responses',
  },
} satisfies ChartConfig;

export function AnswerChart({
  questionText,
  questionType,
  distribution,
}: AnswerChartProps) {
  const data = useMemo(() => {
    const entries = Object.entries(distribution);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return entries
      .map(([answer, count]) => ({
        answer: answer.length > 25 ? answer.slice(0, 22) + '...' : answer,
        fullAnswer: answer,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [distribution]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {questionText}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {questionTypeLabels[questionType] || questionType}
          </p>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
          No responses yet
        </p>
      </div>
    );
  }

  const chartHeight = Math.max(data.length * 40 + 20, 120);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {questionText}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {questionTypeLabels[questionType] || questionType}
        </p>
      </div>

      <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="answer"
            width={100}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-slate-600 dark:fill-slate-400"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <span>{`${value} responses (${item.payload.percentage}%)`}</span>
                )}
              />
            }
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
