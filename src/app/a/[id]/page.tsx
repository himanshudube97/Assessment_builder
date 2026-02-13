'use client';

/**
 * Public Assessment Page
 * Accessible at /a/[id] for respondents to take the assessment
 */

import { useEffect, useState, useCallback, use } from 'react';
import {
  AssessmentFlow,
  PasswordGate,
  NotFoundState,
  ClosedState,
  ScheduledState,
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
  requiresPassword: boolean;
  isScheduled: boolean;
  scheduledOpenAt: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicAssessmentPage({ params }: PageProps) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [error, setError] = useState<'not_found' | 'closed' | 'scheduled' | null>(null);
  const [scheduledOpenAt, setScheduledOpenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  useEffect(() => {
    // Check if password was already verified in this session
    const verified = sessionStorage.getItem(`flowform-pw-${id}`);
    if (verified === 'verified') {
      setIsPasswordVerified(true);
    }
  }, [id]);

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

        if (data.isScheduled) {
          setScheduledOpenAt(data.scheduledOpenAt);
          setError('scheduled');
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

  const handlePasswordVerified = useCallback(() => {
    setIsPasswordVerified(true);
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error === 'not_found') {
    return <NotFoundState />;
  }

  if (error === 'closed') {
    return <ClosedState />;
  }

  if (error === 'scheduled') {
    return <ScheduledState openAt={scheduledOpenAt} />;
  }

  if (!assessment) {
    return <NotFoundState />;
  }

  // Show password gate if required and not yet verified
  if (assessment.requiresPassword && !isPasswordVerified) {
    return (
      <PasswordGate
        assessmentId={assessment.id}
        title={assessment.title}
        onVerified={handlePasswordVerified}
      />
    );
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
