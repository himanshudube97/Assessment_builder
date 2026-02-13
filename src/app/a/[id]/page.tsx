'use client';

/**
 * Public Assessment Page
 * Accessible at /a/[id] for respondents to take the assessment
 */

import { useEffect, useState, use } from 'react';
import {
  AssessmentFlow,
  NotFoundState,
  ClosedState,
  LoadingState,
} from '@/presentation/components/respondent';
import type { FlowNode, FlowEdge } from '@/domain/entities/flow';

interface PublicAssessment {
  id: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: {
    primaryColor?: string;
    backgroundColor?: string;
    showProgressBar?: boolean;
    allowBackNavigation?: boolean;
    scoringEnabled?: boolean;
  };
  status: string;
  isOpen: boolean;
  isClosed: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicAssessmentPage({ params }: PageProps) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [error, setError] = useState<'not_found' | 'closed' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAssessment() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/public/assessments/${id}`);

        if (response.status === 404) {
          setError('not_found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load assessment');
        }

        const data: PublicAssessment = await response.json();

        if (data.isClosed) {
          setError('closed');
          return;
        }

        setAssessment(data);
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('not_found');
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessment();
  }, [id]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error === 'not_found') {
    return <NotFoundState />;
  }

  if (error === 'closed') {
    return <ClosedState />;
  }

  if (!assessment) {
    return <NotFoundState />;
  }

  return (
    <AssessmentFlow
      assessmentId={assessment.id}
      title={assessment.title}
      nodes={assessment.nodes}
      edges={assessment.edges}
      settings={assessment.settings}
    />
  );
}
