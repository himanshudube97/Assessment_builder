/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * Plan pricing and limits
 */
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    maxAssessments: 3,
    maxResponsesPerMonth: 50,
    features: [
      '3 assessments',
      '50 responses/month',
      'Basic question types',
      'Google Sheets export',
    ],
  },
  pro: {
    name: 'Pro',
    price: 12,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    maxAssessments: Infinity,
    maxResponsesPerMonth: 1000,
    features: [
      'Unlimited assessments',
      '1,000 responses/month',
      'Remove watermark',
      'Custom branding',
      'Scoring & quiz mode',
      'Schedule open/close',
    ],
  },
  agency: {
    name: 'Agency',
    price: 39,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    maxAssessments: Infinity,
    maxResponsesPerMonth: 10000,
    features: [
      'Everything in Pro',
      '10,000 responses/month',
      'Custom domain',
      'Full white-label',
      'Password protection',
      'Email notifications',
      'Priority support',
    ],
  },
} as const;

/**
 * Animation durations (in ms)
 * Keep in sync with Tailwind/Framer Motion config
 */
export const ANIMATION = {
  micro: 50,
  fast: 100,
  normal: 150,
  slow: 200,
  slower: 300,
  emphasis: 500,
} as const;

/**
 * Canvas editor settings
 */
export const CANVAS = {
  minZoom: 0.25,
  maxZoom: 2,
  defaultZoom: 1,
  gridSize: 20,
  snapToGrid: true,
  nodeWidth: 280,
  nodeMinHeight: 100,
} as const;

/**
 * Validation limits
 */
export const LIMITS = {
  assessmentTitleMaxLength: 100,
  assessmentDescriptionMaxLength: 500,
  questionTextMaxLength: 500,
  optionTextMaxLength: 200,
  maxOptionsPerQuestion: 10,
  maxNodesPerAssessment: 100,
  shortTextMaxLength: 100,
  longTextMaxLength: 2000,
} as const;

/**
 * API rate limits
 */
export const RATE_LIMITS = {
  // Responses per minute per assessment
  responsesPerMinute: 60,
  // API calls per minute per user
  apiCallsPerMinute: 100,
} as const;

/**
 * Session configuration
 */
export const SESSION = {
  // 30 days in seconds
  maxAge: 30 * 24 * 60 * 60,
  // Cookie name
  cookieName: 'flowform_session',
} as const;

/**
 * Default assessment settings
 */
export const DEFAULT_SETTINGS = {
  primaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  showProgressBar: true,
  allowBackNavigation: true,
  redirectDelaySeconds: 3,
} as const;

/**
 * Question type metadata
 */
export const QUESTION_TYPES = {
  multiple_choice_single: {
    label: 'Multiple Choice',
    description: 'Select one option',
    icon: 'CircleDot',
  },
  multiple_choice_multi: {
    label: 'Checkboxes',
    description: 'Select multiple options',
    icon: 'CheckSquare',
  },
  short_text: {
    label: 'Short Text',
    description: 'Single line answer',
    icon: 'Type',
  },
  long_text: {
    label: 'Long Text',
    description: 'Paragraph answer',
    icon: 'AlignLeft',
  },
  rating: {
    label: 'Rating Scale',
    description: 'Numeric rating',
    icon: 'Star',
  },
  yes_no: {
    label: 'Yes / No',
    description: 'Binary choice',
    icon: 'ToggleLeft',
  },
} as const;
