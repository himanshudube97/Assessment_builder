/**
 * Answer Piping Utilities
 *
 * Enables referencing previous question answers in question text.
 * Storage format: {{nodeId:label}} where nodeId is the source question's ID
 * and label is a human-readable truncation of the question text.
 */

type AnswerValue = string | string[] | number;

// Matches {{nodeId:label}} tokens
const PIPE_REGEX = /\{\{([^:}]+):([^}]+)\}\}/g;

/**
 * Replace piped variable tokens with actual answer values.
 * Used at render time in respondent and preview flows.
 */
export function resolveAnswerPipes(
  text: string,
  answers: Record<string, AnswerValue>,
  fallback: string = '...'
): string {
  return text.replace(PIPE_REGEX, (_match, nodeId: string) => {
    const answer = answers[nodeId];
    if (answer === undefined || answer === null || answer === '') {
      return fallback;
    }
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  });
}

/**
 * Replace piped tokens with @label for display in editor/canvas.
 * e.g. "You said {{question-123:Favorite Color}}" → "You said @Favorite Color"
 */
export function getDisplayText(text: string): string {
  return text.replace(PIPE_REGEX, (_match, _nodeId: string, label: string) => {
    return `@${label}`;
  });
}

/**
 * Check if text contains any pipe references.
 */
export function hasPipeReferences(text: string): boolean {
  return PIPE_REGEX.test(text);
}

/**
 * Find nodeIds of pipe references that point to nodes no longer in the flow.
 */
export function findBrokenPipeReferences(
  text: string,
  existingNodeIds: Set<string>
): string[] {
  const broken: string[] = [];
  let match;
  const regex = new RegExp(PIPE_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (!existingNodeIds.has(match[1])) {
      broken.push(match[1]);
    }
  }
  return broken;
}

/**
 * Build a pipe token string for insertion into question text.
 */
export function buildPipeToken(nodeId: string, label: string): string {
  return `{{${nodeId}:${label}}}`;
}

/**
 * Get all ancestor question nodes of a given node by walking edges backwards (reverse BFS).
 * Returns only question-type nodes that come before the current node in the flow.
 */
export function getAncestorQuestionNodes<
  N extends { id: string; type?: string; data?: unknown },
  E extends { source: string; target: string },
>(currentNodeId: string, nodes: N[], edges: E[]): N[] {
  const visited = new Set<string>();
  const queue: string[] = [currentNodeId];
  const ancestors: N[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode && sourceNode.type === 'question') {
          ancestors.push(sourceNode);
        }
      }
    }
  }

  return ancestors;
}
