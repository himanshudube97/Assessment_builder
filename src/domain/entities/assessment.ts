/**
 * Assessment Domain Entity
 * Represents a form/quiz/survey created by a user
 */

import type { FlowNode, FlowEdge } from './flow';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export type AssessmentStatus = 'draft' | 'published' | 'closed';

export type ButtonStyle = 'filled' | 'outline' | 'pill';
export type CardStyle = 'elevated' | 'bordered' | 'flat';
export type ShadowStyle = 'minimal' | 'soft' | 'dramatic';
export type AnimationPreset = 'subtle' | 'smooth' | 'playful' | 'elegant';

export interface AssessmentSettings {
  primaryColor: string;
  backgroundColor: string;
  showProgressBar: boolean;
  allowBackNavigation: boolean;
  redirectUrl: string | null;
  redirectDelaySeconds: number;
  maxResponses: number | null;
  openAt: Date | null;
  closeAt: Date | null;
  password: string | null; // Hashed
  scoringEnabled: boolean;
  inviteOnly: boolean;

  // Theme
  fontFamily: string;
  borderRadius: string;
  buttonStyle: ButtonStyle;
  cardStyle: CardStyle;

  // Enhanced visual properties (optional for backward compatibility)
  backgroundGradient?: string;
  accentGradient?: string;
  shadowStyle?: ShadowStyle;
  glassEffect?: boolean;
  animationPreset?: AnimationPreset;

  // Background decorations
  backgroundDecoration?: BackgroundDecoration;

  // Custom CSS mode
  customCSSEnabled?: boolean;
}

export interface Assessment {
  id: string;
  organizationId: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  status: AssessmentStatus;

  // Canvas data
  nodes: FlowNode[];
  edges: FlowEdge[];

  // Settings
  settings: AssessmentSettings;

  // Google Sheets integration
  googleSheetId: string | null;
  googleSheetName: string | null;

  // Stats
  responseCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface CreateAssessmentInput {
  organizationId: string;
  createdBy?: string | null;
  title: string;
  description?: string | null;
}

export interface UpdateAssessmentInput {
  title?: string;
  description?: string | null;
  status?: AssessmentStatus;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  settings?: Partial<AssessmentSettings>;
  googleSheetId?: string | null;
  googleSheetName?: string | null;
}

/**
 * Default settings for new assessments
 */
export const DEFAULT_ASSESSMENT_SETTINGS: AssessmentSettings = {
  primaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  showProgressBar: true,
  allowBackNavigation: true,
  redirectUrl: null,
  redirectDelaySeconds: 3,
  maxResponses: null,
  openAt: null,
  closeAt: null,
  password: null,
  scoringEnabled: false,
  inviteOnly: false,
  fontFamily: 'Geist Sans',
  borderRadius: '12px',
  buttonStyle: 'filled',
  cardStyle: 'bordered',
  // Enhanced visual properties
  backgroundGradient: undefined,
  accentGradient: undefined,
  shadowStyle: 'soft',
  glassEffect: false,
  animationPreset: 'smooth',
};

/**
 * Default nodes for a new assessment
 */
export function createDefaultNodes(): FlowNode[] {
  return [
    {
      id: 'start-node',
      type: 'start',
      position: { x: 250, y: 50 },
      data: {
        title: 'Welcome',
        description: 'Thank you for taking this assessment.',
        buttonText: 'Start',
      },
    },
    {
      id: 'end-node',
      type: 'end',
      position: { x: 250, y: 400 },
      data: {
        title: 'Thank You!',
        description: 'Your response has been recorded.',
        showScore: false,
        redirectUrl: null,
      },
    },
  ];
}

/**
 * Default edges for a new assessment
 */
export function createDefaultEdges(): FlowEdge[] {
  return [
    {
      id: 'edge-start-end',
      source: 'start-node',
      target: 'end-node',
      sourceHandle: null,
      condition: null,
    },
  ];
}

/**
 * Check if assessment is currently accepting responses
 */
export function isAssessmentOpen(assessment: Assessment): boolean {
  if (assessment.status !== 'published') return false;

  const now = new Date();
  const { openAt, closeAt, maxResponses } = assessment.settings;

  if (openAt && now < openAt) return false;
  if (closeAt && now > closeAt) return false;
  if (maxResponses && assessment.responseCount >= maxResponses) return false;

  return true;
}

/**
 * Check if assessment requires password
 */
export function isPasswordProtected(assessment: Assessment): boolean {
  return assessment.settings.password !== null;
}
