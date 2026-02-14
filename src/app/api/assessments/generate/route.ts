/**
 * AI Assessment Generation API Route
 * POST /api/assessments/generate
 *
 * Takes a natural language prompt and returns FlowNode[] + FlowEdge[]
 * ready to be loaded onto the canvas.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/infrastructure/auth';
import { AIAssessmentSchema } from '@/domain/schemas/ai-assessment.schema';
import { buildFlowFromAIOutput } from '@/lib/ai-flow-builder';
import { validateFlow } from '@/domain/entities/flow';

// --- Rate Limiting (in-memory) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// --- Prompt Sanitization ---
function sanitizePrompt(input: string): string {
  // Strip control characters (keep newline and tab)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, 500);
}

// --- Build user message with config ---
interface GenerateConfig {
  length: string;
  tone: string;
  complexity: string;
  includeScoring: boolean;
}

const LENGTH_MAP: Record<string, string> = {
  short: '3-5 questions',
  medium: '5-8 questions',
  detailed: '8-15 questions',
};

const COMPLEXITY_MAP: Record<string, string> = {
  simple: 'Linear flow only, no branching. Connect questions sequentially.',
  moderate: 'Include 1-2 conditional branches where logically relevant (e.g., follow-up on low ratings).',
  complex: 'Include multiple branching paths based on answers. Use conditional routing to create different flows for different respondent types.',
};

const TONE_MAP: Record<string, string> = {
  professional: 'Use professional, business-appropriate language.',
  casual: 'Use casual, conversational language. Keep it relaxed and approachable.',
  friendly: 'Use warm, friendly language with an encouraging tone.',
  academic: 'Use formal, academic language appropriate for research or education.',
};

function buildUserMessage(prompt: string, config: GenerateConfig): string {
  const parts = [`Generate an assessment for: ${prompt}`];

  parts.push(`\nRequirements:`);
  parts.push(`- Number of questions: ${LENGTH_MAP[config.length] || '5-8 questions'}`);
  parts.push(`- Tone: ${TONE_MAP[config.tone] || TONE_MAP.professional}`);
  parts.push(`- Branching: ${COMPLEXITY_MAP[config.complexity] || COMPLEXITY_MAP.simple}`);

  if (config.includeScoring) {
    parts.push(`- Include scoring: Set "showScore" to true in the endNode. For multiple_choice_single and yes_no questions, include a "correctAnswer" hint in the question description (e.g., "Correct: Option A") so the user can configure scoring after generation.`);
  }

  return parts.join('\n');
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are an assessment/survey generator. Given a user's description, generate a structured JSON assessment.

RULES:
1. Output ONLY valid JSON. No markdown, no explanation, no code fences, no wrapping text.
2. Follow the exact schema below. Every field is required.
3. Question types must be one of: multiple_choice_single, multiple_choice_multi, short_text, long_text, rating, yes_no, number, email, dropdown, date, nps
4. Condition types must be one of: equals, not_equals, contains, greater_than, less_than
5. Generate 3-10 relevant questions based on the topic.
6. For multiple_choice_single, multiple_choice_multi, dropdown types: always include "options" array with 2-6 string values.
7. For yes_no type: always set options to ["Yes", "No"].
8. For rating type: set min (usually 1), max (usually 5), minLabel, maxLabel. Set options to null.
9. For nps type: set min to 0, max to 10, minLabel to "Not likely at all", maxLabel to "Extremely likely". Set options to null.
10. For number type: set min and max if logical range exists, otherwise null. Set options to null.
11. For short_text, long_text, email, date types: set options, min, max, minLabel, maxLabel all to null.
12. Use branching sparingly and only when logically relevant (e.g., route low satisfaction scores to a follow-up question).
13. "from" and "goto" in branching reference question "id" values (q1, q2, etc.). Use "end" for goto to skip to the end node.
14. Make questions natural, professional, and relevant to the described assessment.
15. Assign sequential ids: q1, q2, q3, etc.

JSON Schema:
{
  "title": "string (max 100 chars)",
  "description": "string or null",
  "startNode": { "title": "string", "description": "string", "buttonText": "string" },
  "endNode": { "title": "string", "description": "string", "showScore": false },
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice_single",
      "text": "question text",
      "description": null,
      "required": true,
      "options": ["Option A", "Option B", "Option C"],
      "min": null,
      "max": null,
      "minLabel": null,
      "maxLabel": null
    }
  ],
  "branching": [
    { "from": "q1", "condition": "equals", "value": "Option A", "goto": "q3" }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can generate up to 5 assessments per hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const prompt = body.prompt;
    const length = body.length || 'medium';       // short | medium | detailed
    const tone = body.tone || 'professional';      // professional | casual | friendly | academic
    const complexity = body.complexity || 'moderate'; // simple | moderate | complex
    const includeScoring = body.includeScoring === true;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    if (sanitizedPrompt.length < 5) {
      return NextResponse.json(
        { error: 'Prompt must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI generation is not configured. Set ANTHROPIC_API_KEY in your environment.' },
        { status: 503 }
      );
    }

    // Build the user message with config context
    const userMessage = buildUserMessage(sanitizedPrompt, {
      length,
      tone,
      complexity,
      includeScoring,
    });

    // Call Claude Haiku
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content
    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'AI did not return a valid response. Please try again.' },
        { status: 502 }
      );
    }

    // Parse JSON from response
    let rawJson: unknown;
    try {
      // Handle potential markdown code fences wrapping the JSON
      let text = textBlock.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      rawJson = JSON.parse(text);
    } catch {
      console.error('AI returned invalid JSON:', textBlock.text.slice(0, 200));
      return NextResponse.json(
        { error: 'AI returned an invalid response. Please try again.' },
        { status: 502 }
      );
    }

    // Validate with Zod
    const parseResult = AIAssessmentSchema.safeParse(rawJson);
    if (!parseResult.success) {
      console.error(
        'AI output validation failed:',
        JSON.stringify(parseResult.error.format(), null, 2)
      );
      return NextResponse.json(
        { error: 'AI generated an invalid assessment structure. Please try again with a clearer prompt.' },
        { status: 502 }
      );
    }

    // Build flow using deterministic builder
    const flowResult = buildFlowFromAIOutput(parseResult.data);

    // Validate the resulting flow
    const validationErrors = validateFlow(flowResult.nodes, flowResult.edges);
    const hasErrors = validationErrors.some((e) => e.type === 'error');

    return NextResponse.json({
      title: flowResult.title,
      description: flowResult.description,
      nodes: flowResult.nodes,
      edges: flowResult.edges,
      validationWarnings: validationErrors,
      hasErrors,
    });
  } catch (error) {
    console.error('Error generating assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate assessment' },
      { status: 500 }
    );
  }
}
