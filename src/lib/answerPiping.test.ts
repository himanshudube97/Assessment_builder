import { describe, it, expect } from 'vitest';
import {
  resolveAnswerPipes,
  getDisplayText,
  hasPipeReferences,
  findBrokenPipeReferences,
  buildPipeToken,
  getAncestorQuestionNodes,
} from './answerPiping';

describe('resolveAnswerPipes', () => {
  it('replaces {{nodeId:label}} with the matching answer value', () => {
    const text = 'Hello {{q-1:Name}}!';
    const answers = { 'q-1': 'Alice' };
    expect(resolveAnswerPipes(text, answers)).toBe('Hello Alice!');
  });

  it('uses fallback text when answer is undefined', () => {
    const text = 'Hello {{q-1:Name}}!';
    expect(resolveAnswerPipes(text, {})).toBe('Hello ...!');
  });

  it('uses fallback text when answer is empty string', () => {
    const text = 'Hello {{q-1:Name}}!';
    expect(resolveAnswerPipes(text, { 'q-1': '' })).toBe('Hello ...!');
  });

  it('joins array answers with comma-space', () => {
    const text = 'Choices: {{q-1:Hobbies}}';
    const answers = { 'q-1': ['Reading', 'Gaming', 'Cooking'] };
    expect(resolveAnswerPipes(text, answers)).toBe('Choices: Reading, Gaming, Cooking');
  });

  it('converts number answers to string', () => {
    const text = 'You rated {{q-1:Rating}}';
    const answers = { 'q-1': 5 };
    expect(resolveAnswerPipes(text, answers)).toBe('You rated 5');
  });

  it('handles multiple pipe tokens in one string', () => {
    const text = '{{q-1:Name}} chose {{q-2:Color}}';
    const answers = { 'q-1': 'Alice', 'q-2': 'Blue' };
    expect(resolveAnswerPipes(text, answers)).toBe('Alice chose Blue');
  });

  it('returns original text when no tokens present', () => {
    const text = 'Just regular text';
    expect(resolveAnswerPipes(text, {})).toBe('Just regular text');
  });

  it('uses custom fallback when provided', () => {
    const text = 'Hello {{q-1:Name}}!';
    expect(resolveAnswerPipes(text, {}, '[unknown]')).toBe('Hello [unknown]!');
  });
});

describe('getDisplayText', () => {
  it('replaces {{nodeId:label}} with @label', () => {
    const text = 'You said {{question-123:Favorite Color}}';
    expect(getDisplayText(text)).toBe('You said @Favorite Color');
  });

  it('handles multiple tokens', () => {
    const text = '{{q-1:Name}} and {{q-2:Age}}';
    expect(getDisplayText(text)).toBe('@Name and @Age');
  });

  it('returns original text when no tokens present', () => {
    expect(getDisplayText('plain text')).toBe('plain text');
  });
});

describe('hasPipeReferences', () => {
  it('returns true for text containing {{nodeId:label}}', () => {
    expect(hasPipeReferences('Hello {{q-1:Name}}')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasPipeReferences('Just text')).toBe(false);
  });

  it('returns false for malformed tokens like {{noColon}}', () => {
    expect(hasPipeReferences('{{noColon}}')).toBe(false);
  });

  it('returns true on consecutive calls (global regex lastIndex bug)', () => {
    const text = 'Answer: {{node-1:Question 1}}';
    expect(hasPipeReferences(text)).toBe(true);
    expect(hasPipeReferences(text)).toBe(true);
  });
});

describe('findBrokenPipeReferences', () => {
  it('returns empty array when all referenced nodeIds exist', () => {
    const text = 'Hello {{q-1:Name}} and {{q-2:Age}}';
    const ids = new Set(['q-1', 'q-2']);
    expect(findBrokenPipeReferences(text, ids)).toEqual([]);
  });

  it('returns broken nodeIds that are not in existingNodeIds set', () => {
    const text = 'Hello {{q-1:Name}} and {{q-deleted:Age}}';
    const ids = new Set(['q-1']);
    expect(findBrokenPipeReferences(text, ids)).toEqual(['q-deleted']);
  });

  it('returns empty array when text has no pipe references', () => {
    expect(findBrokenPipeReferences('plain text', new Set(['q-1']))).toEqual([]);
  });

  it('handles multiple broken references', () => {
    const text = '{{gone-1:A}} and {{gone-2:B}}';
    expect(findBrokenPipeReferences(text, new Set())).toEqual(['gone-1', 'gone-2']);
  });
});

describe('buildPipeToken', () => {
  it('produces {{nodeId:label}} format', () => {
    expect(buildPipeToken('q-123', 'My Question')).toBe('{{q-123:My Question}}');
  });
});

describe('getAncestorQuestionNodes', () => {
  const nodes = [
    { id: 'start-1', type: 'start' },
    { id: 'q-1', type: 'question' },
    { id: 'q-2', type: 'question' },
    { id: 'q-3', type: 'question' },
    { id: 'end-1', type: 'end' },
  ];

  it('returns empty array when node has no incoming edges', () => {
    const edges = [{ source: 'start-1', target: 'q-1' }];
    expect(getAncestorQuestionNodes('start-1', nodes, edges)).toEqual([]);
  });

  it('returns direct parent question nodes', () => {
    const edges = [
      { source: 'start-1', target: 'q-1' },
      { source: 'q-1', target: 'q-2' },
    ];
    const ancestors = getAncestorQuestionNodes('q-2', nodes, edges);
    expect(ancestors).toHaveLength(1);
    expect(ancestors[0].id).toBe('q-1');
  });

  it('returns transitive ancestors (grandparent questions)', () => {
    const edges = [
      { source: 'start-1', target: 'q-1' },
      { source: 'q-1', target: 'q-2' },
      { source: 'q-2', target: 'q-3' },
    ];
    const ancestors = getAncestorQuestionNodes('q-3', nodes, edges);
    expect(ancestors.map((n) => n.id)).toContain('q-1');
    expect(ancestors.map((n) => n.id)).toContain('q-2');
  });

  it('excludes start nodes from results', () => {
    const edges = [
      { source: 'start-1', target: 'q-1' },
    ];
    const ancestors = getAncestorQuestionNodes('q-1', nodes, edges);
    expect(ancestors.find((n) => n.id === 'start-1')).toBeUndefined();
  });

  it('handles diamond-shaped graphs without duplicates', () => {
    // start -> q-1, start -> q-2, q-1 -> q-3, q-2 -> q-3
    const edges = [
      { source: 'start-1', target: 'q-1' },
      { source: 'start-1', target: 'q-2' },
      { source: 'q-1', target: 'q-3' },
      { source: 'q-2', target: 'q-3' },
    ];
    const ancestors = getAncestorQuestionNodes('q-3', nodes, edges);
    const ids = ancestors.map((n) => n.id);
    expect(ids).toContain('q-1');
    expect(ids).toContain('q-2');
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });

  it('handles cycles without infinite loop', () => {
    // q-1 -> q-2 -> q-1 (cycle) — key assertion is termination, not exact count
    const edges = [
      { source: 'q-1', target: 'q-2' },
      { source: 'q-2', target: 'q-1' },
    ];
    const ancestors = getAncestorQuestionNodes('q-2', nodes, edges);
    expect(ancestors.length).toBeGreaterThanOrEqual(1);
    expect(ancestors.map((n) => n.id)).toContain('q-1');
  });
});
