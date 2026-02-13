/**
 * Zod schema for validating AI-generated assessment output.
 *
 * This is the "simple" intermediate JSON that the LLM returns.
 * A deterministic builder then converts it to FlowNode[] + FlowEdge[].
 */

import { z } from 'zod';

const QuestionTypeEnum = z.enum([
  'multiple_choice_single',
  'multiple_choice_multi',
  'short_text',
  'long_text',
  'rating',
  'yes_no',
  'number',
  'email',
  'dropdown',
  'date',
  'nps',
]);

const ConditionTypeEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
]);

const AIQuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeEnum,
  text: z.string().min(1).max(500),
  description: z.string().nullable(),
  required: z.boolean(),
  options: z.array(z.string().min(1).max(200)).nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  minLabel: z.string().nullable(),
  maxLabel: z.string().nullable(),
});

const AIBranchingSchema = z.object({
  from: z.string(),
  condition: ConditionTypeEnum,
  value: z.union([z.string(), z.number()]),
  goto: z.string(),
});

export const AIAssessmentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().nullable(),
  startNode: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500),
    buttonText: z.string().min(1).max(50),
  }),
  endNode: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500),
    showScore: z.boolean(),
  }),
  questions: z.array(AIQuestionSchema).min(1).max(20),
  branching: z.array(AIBranchingSchema).default([]),
});

export type AIAssessmentOutput = z.infer<typeof AIAssessmentSchema>;
export type AIQuestion = z.infer<typeof AIQuestionSchema>;
export type AIBranching = z.infer<typeof AIBranchingSchema>;
