'use client';

/**
 * Analytics Page
 * Shows response statistics, charts, and individual response data
 */

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Percent,
  Trophy,
  Clock,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StatsCard,
  AnswerChart,
  ResponseTimeline,
  ScoreHistogram,
  NpsGauge,
  DeviceChart,
  SourceChart,
  ResponseTable,
  CsvExportButton,
} from '@/presentation/components/analytics';

interface QuestionStat {
  nodeId: string;
  questionText: string;
  questionType: string;
  distribution: Record<string, number>;
}

interface AnalyticsData {
  totalResponses: number;
  averageScore: number | null;
  completionRate: number;
  questionStats: QuestionStat[];
  timeline: { date: string; count: number }[];
  completionTime: {
    median: number | null;
    average: number | null;
    min: number | null;
    max: number | null;
  };
  scoreDistribution: { range: string; count: number }[];
  npsStats: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
    distribution: Record<string, number>;
  } | null;
  deviceBreakdown: { device: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function AnalyticsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Load assessment title
        const assessmentRes = await fetch(`/api/assessments/${id}`);
        if (assessmentRes.ok) {
          const assessment = await assessmentRes.json();
          setTitle(assessment.title);
        }

        // Load analytics
        const analyticsRes = await fetch(`/api/assessments/${id}/analytics`);
        if (!analyticsRes.ok) {
          throw new Error('Failed to load analytics');
        }

        const data = await analyticsRes.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-slate-500 dark:text-slate-400">Loading analytics...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const hasScoring = analytics?.scoreDistribution && analytics.scoreDistribution.length > 0;
  const hasNps = analytics?.npsStats !== null && analytics?.npsStats !== undefined;
  const hasResponses = (analytics?.totalResponses || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${id}/edit`)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Users}
                label="Total Responses"
                value={analytics?.totalResponses || 0}
                color="indigo"
              />
              <StatsCard
                icon={Percent}
                label="Completion Rate"
                value={`${analytics?.completionRate || 0}%`}
                color="emerald"
              />
              <StatsCard
                icon={Trophy}
                label="Average Score"
                value={
                  analytics?.averageScore != null
                    ? analytics.averageScore.toFixed(1)
                    : 'N/A'
                }
                description={
                  analytics?.averageScore != null
                    ? 'Out of max score'
                    : 'Scoring not enabled'
                }
                color="amber"
              />
              <StatsCard
                icon={Clock}
                label="Median Time"
                value={formatDuration(analytics?.completionTime?.median)}
                description={
                  analytics?.completionTime?.median
                    ? `Avg: ${formatDuration(analytics.completionTime.average)}`
                    : 'Not enough data'
                }
                color="rose"
              />
            </div>

            {/* Response Timeline */}
            {hasResponses && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ResponseTimeline data={analytics?.timeline || []} />
              </motion.div>
            )}

            {/* Score Distribution + NPS row */}
            {(hasScoring || hasNps) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasScoring && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <ScoreHistogram data={analytics?.scoreDistribution || []} />
                  </motion.div>
                )}
                {hasNps && analytics?.npsStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <NpsGauge {...analytics.npsStats} />
                  </motion.div>
                )}
              </div>
            )}

            {/* Device + Source row */}
            {hasResponses && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DeviceChart data={analytics?.deviceBreakdown || []} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <SourceChart data={analytics?.sourceBreakdown || []} />
                </motion.div>
              </div>
            )}

            {/* Question Charts */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Response Distribution
                </h2>
              </div>

              {analytics?.questionStats && analytics.questionStats.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analytics.questionStats.map((stat, index) => (
                    <motion.div
                      key={stat.nodeId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <AnswerChart
                        questionText={stat.questionText}
                        questionType={stat.questionType}
                        distribution={stat.distribution}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No question data to display yet
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== RESPONSES TAB ===== */}
          <TabsContent value="responses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Individual Responses
              </h2>
              <CsvExportButton assessmentId={id} assessmentTitle={title} />
            </div>
            <ResponseTable assessmentId={id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
