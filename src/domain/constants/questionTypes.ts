/**
 * Shared question type metadata
 * Single source of truth for labels, icons, and colors used across
 * CanvasSidebar, QuestionNode, ConnectionMenu, and CanvasSearch.
 */

import {
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import type { QuestionType } from '@/domain/entities/flow';

export interface QuestionTypeMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;        // e.g. 'text-orange-500'
  bgColor: string;      // e.g. 'bg-orange-100 dark:bg-orange-900/30'
  headerColor: string;  // e.g. 'bg-blue-500'  (node header)
  borderColor: string;  // e.g. 'border-blue-300 dark:border-blue-700' (node border)
}

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  multiple_choice_single: {
    label: 'Multiple Choice',
    description: 'Select one option',
    icon: CircleDot,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    headerColor: 'bg-blue-500',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  multiple_choice_multi: {
    label: 'Checkboxes',
    description: 'Select multiple options',
    icon: CheckSquare,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    headerColor: 'bg-indigo-500',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
  },
  short_text: {
    label: 'Short Text',
    description: 'Single line answer',
    icon: Type,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    headerColor: 'bg-cyan-500',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
  long_text: {
    label: 'Long Text',
    description: 'Paragraph answer',
    icon: AlignLeft,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    headerColor: 'bg-teal-500',
    borderColor: 'border-teal-300 dark:border-teal-700',
  },
  rating: {
    label: 'Rating Scale',
    description: 'Numeric rating',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    headerColor: 'bg-amber-500',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  yes_no: {
    label: 'Yes / No',
    description: 'Binary choice',
    icon: ToggleLeft,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    headerColor: 'bg-pink-500',
    borderColor: 'border-pink-300 dark:border-pink-700',
  },
  number: {
    label: 'Number',
    description: 'Numeric input',
    icon: Hash,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    headerColor: 'bg-emerald-500',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
  },
  email: {
    label: 'Email',
    description: 'Email address',
    icon: Mail,
    color: 'text-rose-500',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    headerColor: 'bg-rose-500',
    borderColor: 'border-rose-300 dark:border-rose-700',
  },
  dropdown: {
    label: 'Dropdown',
    description: 'Select from list',
    icon: ChevronDown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    headerColor: 'bg-purple-500',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  date: {
    label: 'Date',
    description: 'Date picker',
    icon: Calendar,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    headerColor: 'bg-sky-500',
    borderColor: 'border-sky-300 dark:border-sky-700',
  },
  nps: {
    label: 'NPS Score',
    description: '0-10 loyalty scale',
    icon: Gauge,
    color: 'text-lime-500',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    headerColor: 'bg-lime-500',
    borderColor: 'border-lime-300 dark:border-lime-700',
  },
};

/** Ordered list of all question types (for menus and filters) */
export const QUESTION_TYPES_LIST = Object.entries(QUESTION_TYPE_META) as [QuestionType, QuestionTypeMeta][];
