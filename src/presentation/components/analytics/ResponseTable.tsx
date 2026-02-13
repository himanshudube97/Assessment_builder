'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ArrowUpDown, Filter, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponseAnswer {
  nodeId: string;
  questionText: string;
  value: string | string[] | number;
}

interface ResponseItem {
  id: string;
  submittedAt: string;
  startedAt: string;
  score: number | null;
  maxScore: number | null;
  answers: ResponseAnswer[];
}

interface QuestionColumn {
  nodeId: string;
  questionText: string;
  shortLabel: string;
}

interface ResponseTableProps {
  assessmentId: string;
}

function formatTime(startedAt: string, submittedAt: string): string {
  const diff = Math.round(
    (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  if (diff <= 5) return '-';
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: string | string[] | number): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

type SortField = 'submittedAt' | 'time' | 'score' | string;
type SortDir = 'asc' | 'desc';

export function ResponseTable({ assessmentId }: ResponseTableProps) {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [filterCol, setFilterCol] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const limit = 50;

  const loadResponses = useCallback(
    async (currentOffset: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/assessments/${assessmentId}/responses?limit=${limit}&offset=${currentOffset}`
        );
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (currentOffset === 0) {
          setResponses(data.responses);
        } else {
          setResponses((prev) => [...prev, ...data.responses]);
        }
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to load responses:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [assessmentId]
  );

  useEffect(() => {
    loadResponses(0);
  }, [loadResponses]);

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadResponses(newOffset);
  };

  // Build question columns from first response (all responses have same structure)
  const questionColumns: QuestionColumn[] = useMemo(() => {
    if (responses.length === 0) return [];
    // Use the response with most answers to get all columns
    const bestResponse = responses.reduce((best, r) =>
      r.answers.length > best.answers.length ? r : best
    );
    return bestResponse.answers.map((a, i) => ({
      nodeId: a.nodeId,
      questionText: a.questionText,
      shortLabel: `Q${i + 1}`,
    }));
  }, [responses]);

  // Get answer for a specific question in a response
  const getAnswer = useCallback(
    (response: ResponseItem, nodeId: string): string => {
      const answer = response.answers.find((a) => a.nodeId === nodeId);
      if (!answer) return '-';
      return formatValue(answer.value);
    },
    []
  );

  // Unique values for grouping/filtering
  const uniqueValuesForColumn = useMemo(() => {
    if (!groupBy && !filterCol) return [];
    const col = groupBy || filterCol;
    if (!col) return [];
    const values = new Set<string>();
    responses.forEach((r) => {
      values.add(getAnswer(r, col));
    });
    return Array.from(values).sort();
  }, [responses, groupBy, filterCol, getAnswer]);

  // Sort and filter
  const processedResponses = useMemo(() => {
    let result = [...responses];

    // Filter
    if (filterCol && filterValue) {
      result = result.filter((r) => {
        const val = getAnswer(r, filterCol);
        return val.toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'submittedAt') {
        cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else if (sortField === 'time') {
        const timeA =
          new Date(a.submittedAt).getTime() - new Date(a.startedAt).getTime();
        const timeB =
          new Date(b.submittedAt).getTime() - new Date(b.startedAt).getTime();
        cmp = timeA - timeB;
      } else if (sortField === 'score') {
        cmp = (a.score ?? -1) - (b.score ?? -1);
      } else {
        // Sort by question answer
        const valA = getAnswer(a, sortField);
        const valB = getAnswer(b, sortField);
        cmp = valA.localeCompare(valB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [responses, sortField, sortDir, filterCol, filterValue, getAnswer]);

  // Group responses
  const groupedResponses = useMemo(() => {
    if (!groupBy) return null;

    const groups: Record<string, ResponseItem[]> = {};
    processedResponses.forEach((r) => {
      const key = getAnswer(r, groupBy);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [processedResponses, groupBy, getAnswer]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors', className)}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={cn(
            'h-3 w-3',
            sortField === field
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400'
          )}
        />
      </span>
    </TableHead>
  );

  if (isLoading && responses.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        No responses yet
      </div>
    );
  }

  const renderRows = (items: ResponseItem[]) =>
    items.map((response, idx) => (
      <TableRow key={response.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
        <TableCell className="text-xs text-slate-400 font-mono w-10">
          {idx + 1}
        </TableCell>
        <TableCell className="text-sm whitespace-nowrap">
          {formatDate(response.submittedAt)}
        </TableCell>
        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
          {formatTime(response.startedAt, response.submittedAt)}
        </TableCell>
        {questionColumns.map((col) => (
          <TableCell key={col.nodeId} className="text-sm max-w-50 truncate" title={getAnswer(response, col.nodeId)}>
            {getAnswer(response, col.nodeId)}
          </TableCell>
        ))}
        <TableCell>
          {response.score !== null ? (
            <Badge variant="secondary" className="whitespace-nowrap">
              {response.score}/{response.maxScore}
            </Badge>
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </TableCell>
      </TableRow>
    ));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Group by dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Group by:</span>
          <select
            value={groupBy || ''}
            onChange={(e) => setGroupBy(e.target.value || null)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">None</option>
            {questionColumns.map((col) => (
              <option key={col.nodeId} value={col.nodeId}>
                {col.shortLabel}: {col.questionText.slice(0, 30)}
              </option>
            ))}
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterCol || ''}
            onChange={(e) => {
              setFilterCol(e.target.value || null);
              setFilterValue('');
            }}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">Filter by...</option>
            {questionColumns.map((col) => (
              <option key={col.nodeId} value={col.nodeId}>
                {col.shortLabel}: {col.questionText.slice(0, 30)}
              </option>
            ))}
          </select>
          {filterCol && (
            <>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Contains..."
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-32"
              />
              <button
                onClick={() => {
                  setFilterCol(null);
                  setFilterValue('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-3 w-3 text-slate-400" />
              </button>
            </>
          )}
        </div>

        <span className="text-xs text-slate-400 ml-auto">
          {filterCol && filterValue
            ? `${processedResponses.length} of ${responses.length}`
            : `${responses.length} of ${total}`}{' '}
          responses
        </span>
      </div>

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-10 text-xs">#</TableHead>
              <SortableHeader field="submittedAt" className="text-xs whitespace-nowrap">
                Date
              </SortableHeader>
              <SortableHeader field="time" className="text-xs whitespace-nowrap">
                Time
              </SortableHeader>
              {questionColumns.map((col) => (
                <SortableHeader key={col.nodeId} field={col.nodeId} className="text-xs">
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {col.shortLabel}
                    </span>
                    <span className="font-normal text-slate-400 truncate max-w-35">
                      {col.questionText}
                    </span>
                  </span>
                </SortableHeader>
              ))}
              <SortableHeader field="score" className="text-xs">
                Score
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedResponses
              ? groupedResponses.map(([groupValue, items]) => (
                  <>
                    <TableRow key={`group-${groupValue}`}>
                      <TableCell
                        colSpan={questionColumns.length + 4}
                        className="bg-slate-100 dark:bg-slate-800/60 py-2 px-4"
                      >
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {questionColumns.find((c) => c.nodeId === groupBy)?.shortLabel}:{' '}
                          {groupValue}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {items.length}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {renderRows(items)}
                  </>
                ))
              : renderRows(processedResponses)}
          </TableBody>
        </Table>
      </div>

      {responses.length < total && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Load More ({responses.length} of {total})
          </Button>
        </div>
      )}
    </div>
  );
}
