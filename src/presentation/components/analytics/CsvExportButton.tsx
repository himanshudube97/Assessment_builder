'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CsvExportButtonProps {
  assessmentId: string;
  assessmentTitle: string;
}

export function CsvExportButton({ assessmentId, assessmentTitle }: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/responses?limit=10000`);
      if (!res.ok) throw new Error('Failed to fetch responses');

      const data = await res.json();
      const responses = data.responses as Array<{
        submittedAt: string;
        startedAt: string;
        answers: Array<{ questionText: string; value: string | string[] | number }>;
        score: number | null;
        maxScore: number | null;
      }>;

      if (responses.length === 0) return;

      // Build CSV headers from first response's questions
      const questionHeaders = responses[0].answers.map((a) => a.questionText);
      const headers = ['Timestamp', 'Time to Complete', ...questionHeaders, 'Score'];

      const rows = responses.map((r) => {
        const submitted = new Date(r.submittedAt);
        const started = new Date(r.startedAt);
        const timeSec = Math.round((submitted.getTime() - started.getTime()) / 1000);
        const timeStr = timeSec > 5 ? `${Math.floor(timeSec / 60)}m ${timeSec % 60}s` : '';

        const values = [
          submitted.toISOString(),
          timeStr,
          ...r.answers.map((a) => {
            const val = Array.isArray(a.value) ? a.value.join('; ') : String(a.value);
            return `"${val.replace(/"/g, '""')}"`;
          }),
          r.score !== null ? `${r.score}/${r.maxScore}` : '',
        ];
        return values.join(',');
      });

      const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${assessmentTitle.replace(/[^a-z0-9]/gi, '_')}_responses.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
