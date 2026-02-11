/**
 * Response Domain Entity
 * Represents a submission from a respondent
 */

export interface Answer {
  nodeId: string;
  questionText: string; // Denormalized for easy export
  value: string | string[] | number;
}

export interface ResponseMetadata {
  userAgent: string;
  ipCountry: string | null;
  referrer: string | null;
}

export interface Response {
  id: string;
  assessmentId: string;
  answers: Answer[];
  score: number | null;
  maxScore: number | null;
  startedAt: Date;
  submittedAt: Date;
  metadata: ResponseMetadata;
}

export interface CreateResponseInput {
  assessmentId: string;
  answers: Answer[];
  score?: number | null;
  maxScore?: number | null;
  metadata: ResponseMetadata;
}

/**
 * Calculate score from answers (if scoring is enabled)
 */
export function calculateScore(
  answers: Answer[],
  nodes: { id: string; data: { points?: number; correctAnswer?: string | string[] } }[]
): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  answers.forEach((answer) => {
    const node = nodeMap.get(answer.nodeId);
    if (!node?.data?.points) return;

    maxScore += node.data.points;

    const { correctAnswer } = node.data;
    if (!correctAnswer) return;

    // Check if answer is correct
    if (Array.isArray(correctAnswer)) {
      // Multiple correct answers
      const answerValue = Array.isArray(answer.value)
        ? answer.value
        : [answer.value.toString()];
      const isCorrect =
        answerValue.length === correctAnswer.length &&
        answerValue.every((a) => correctAnswer.includes(a));
      if (isCorrect) score += node.data.points;
    } else {
      // Single correct answer
      const isCorrect = answer.value.toString() === correctAnswer.toString();
      if (isCorrect) score += node.data.points;
    }
  });

  return { score, maxScore };
}

/**
 * Format response for Google Sheets export
 */
export function formatResponseForSheet(response: Response): Record<string, string> {
  const row: Record<string, string> = {
    Timestamp: response.submittedAt.toISOString(),
  };

  response.answers.forEach((answer, index) => {
    const key = `Q${index + 1}: ${answer.questionText}`.substring(0, 50);
    const value = Array.isArray(answer.value)
      ? answer.value.join(', ')
      : answer.value.toString();
    row[key] = value;
  });

  if (response.score !== null) {
    row['Score'] = `${response.score}/${response.maxScore}`;
  }

  return row;
}

/**
 * Format response for CSV export
 */
export function formatResponseForCSV(
  responses: Response[],
  questionHeaders: string[]
): string {
  const headers = ['Timestamp', ...questionHeaders, 'Score'];
  const rows = responses.map((r) => {
    const values = [r.submittedAt.toISOString()];

    // Map answers by nodeId for consistent ordering
    const answerMap = new Map(r.answers.map((a) => [a.nodeId, a]));

    questionHeaders.forEach((_, index) => {
      const answer = r.answers[index];
      if (answer) {
        const value = Array.isArray(answer.value)
          ? answer.value.join('; ')
          : answer.value.toString();
        values.push(`"${value.replace(/"/g, '""')}"`);
      } else {
        values.push('');
      }
    });

    values.push(r.score !== null ? `${r.score}/${r.maxScore}` : '');
    return values.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
