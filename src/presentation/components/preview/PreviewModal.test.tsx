// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewModal } from './PreviewModal';
import type { FlowNode, FlowEdge } from '@/domain/entities/flow';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    path: (props: Record<string, unknown>) => <path {...props} />,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <span data-testid="icon-x" {...props} />,
  ChevronLeft: (props: Record<string, unknown>) => <span data-testid="icon-left" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <span data-testid="icon-right" {...props} />,
  RotateCcw: (props: Record<string, unknown>) => <span data-testid="icon-reset" {...props} />,
}));

const startNode: FlowNode = {
  id: 'start',
  type: 'start',
  position: { x: 0, y: 0 },
  data: { title: 'Welcome', description: 'Please complete this assessment', buttonText: 'Begin' },
};

const q1: FlowNode = {
  id: 'q-1',
  type: 'question',
  position: { x: 0, y: 100 },
  data: {
    questionText: 'What is your name?',
    questionType: 'short_text',
    required: false,
    description: 'Enter your full name',
  },
};

const q2MCQ: FlowNode = {
  id: 'q-2',
  type: 'question',
  position: { x: 0, y: 200 },
  data: {
    questionText: 'Favorite color?',
    questionType: 'multiple_choice_single',
    required: true,
    description: null,
    options: [
      { id: 'opt-r', text: 'Red' },
      { id: 'opt-b', text: 'Blue' },
      { id: 'opt-g', text: 'Green' },
    ],
  },
};

const q3Rating: FlowNode = {
  id: 'q-3',
  type: 'question',
  position: { x: 0, y: 300 },
  data: {
    questionText: 'Rate this',
    questionType: 'rating',
    required: false,
    description: null,
    minValue: 1,
    maxValue: 5,
    minLabel: 'Poor',
    maxLabel: 'Great',
  },
};

const endNode: FlowNode = {
  id: 'end',
  type: 'end',
  position: { x: 0, y: 400 },
  data: { title: 'Thank You!', description: 'All done.', showScore: false, redirectUrl: null },
};

const linearNodes: FlowNode[] = [startNode, q1, q2MCQ, q3Rating, endNode];
const linearEdges: FlowEdge[] = [
  { id: 'e1', source: 'start', target: 'q-1', sourceHandle: null, condition: null },
  { id: 'e2', source: 'q-1', target: 'q-2', sourceHandle: null, condition: null },
  { id: 'e3', source: 'q-2', target: 'q-3', sourceHandle: null, condition: null },
  { id: 'e4', source: 'q-3', target: 'end', sourceHandle: null, condition: null },
];

describe('PreviewModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <PreviewModal isOpen={false} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders start screen with title and button', () => {
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Please complete this assessment')).toBeInTheDocument();
    expect(screen.getByText('Begin')).toBeInTheDocument();
  });

  it('navigates from start to first question', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('renders MCQ options', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    // Navigate past q1
    await user.click(screen.getByText('Next'));
    // Now on q2 (MCQ)
    expect(screen.getByText('Favorite color?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  it('disables Next when required question has no answer', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    await user.click(screen.getByText('Next')); // skip q1 (not required)
    // Now on q2 (required MCQ)
    const nextBtn = screen.getByText('Next').closest('button')!;
    expect(nextBtn).toBeDisabled();
  });

  it('enables Next after selecting MCQ option', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    await user.click(screen.getByText('Next'));
    // Select an option
    await user.click(screen.getByText('Blue'));
    const nextBtn = screen.getByText('Next').closest('button')!;
    expect(nextBtn).not.toBeDisabled();
  });

  it('renders rating scale buttons', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    await user.click(screen.getByText('Next')); // q1
    await user.click(screen.getByText('Red'));
    await user.click(screen.getByText('Next')); // q2
    // Now on q3 (rating)
    expect(screen.getByText('Rate this')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Great')).toBeInTheDocument();
    // Rating buttons 1-5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders end screen', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    await user.click(screen.getByText('Next')); // q1 → q2
    await user.click(screen.getByText('Red'));
    await user.click(screen.getByText('Next')); // q2 → q3
    await user.click(screen.getByText('Next')); // q3 → end
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
    expect(screen.getByText('All done.')).toBeInTheDocument();
  });

  it('supports Back navigation', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    await user.click(screen.getByText('Back'));
    // Back to start screen
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('handles Reset', async () => {
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={vi.fn()} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    await user.click(screen.getByText('Begin'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Reset'));
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <PreviewModal isOpen={true} onClose={onClose} nodes={linearNodes} edges={linearEdges} title="Test" />
    );

    // Click the outermost overlay — the first motion.div
    const overlay = screen.getByText('Preview Mode').closest('[class*="fixed"]')!;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  describe('conditional navigation', () => {
    it('follows conditional edge when condition matches', async () => {
      const user = userEvent.setup();

      const condNodes: FlowNode[] = [
        startNode,
        q1,
        { id: 'end-yes', type: 'end', position: { x: 0, y: 200 }, data: { title: 'Got Text!', description: '', showScore: false, redirectUrl: null } },
        endNode,
      ];
      const condEdges: FlowEdge[] = [
        { id: 'e1', source: 'start', target: 'q-1', sourceHandle: null, condition: null },
        { id: 'e2', source: 'q-1', target: 'end-yes', sourceHandle: null, condition: { type: 'equals', value: 'hello' } },
        { id: 'e3', source: 'q-1', target: 'end', sourceHandle: null, condition: null },
      ];

      render(
        <PreviewModal isOpen={true} onClose={vi.fn()} nodes={condNodes} edges={condEdges} title="Test" />
      );

      await user.click(screen.getByText('Begin'));
      await user.type(screen.getByRole('textbox'), 'hello');
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Got Text!')).toBeInTheDocument();
    });

    it('follows default edge when condition does not match', async () => {
      const user = userEvent.setup();

      const condNodes: FlowNode[] = [
        startNode,
        q1,
        { id: 'end-yes', type: 'end', position: { x: 0, y: 200 }, data: { title: 'Got Text!', description: '', showScore: false, redirectUrl: null } },
        endNode,
      ];
      const condEdges: FlowEdge[] = [
        { id: 'e1', source: 'start', target: 'q-1', sourceHandle: null, condition: null },
        { id: 'e2', source: 'q-1', target: 'end-yes', sourceHandle: null, condition: { type: 'equals', value: 'hello' } },
        { id: 'e3', source: 'q-1', target: 'end', sourceHandle: null, condition: null },
      ];

      render(
        <PreviewModal isOpen={true} onClose={vi.fn()} nodes={condNodes} edges={condEdges} title="Test" />
      );

      await user.click(screen.getByText('Begin'));
      await user.type(screen.getByRole('textbox'), 'bye');
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
    });

    it('follows conditional branching', async () => {
      const user = userEvent.setup();

      const branchNodes: FlowNode[] = [
        startNode,
        q2MCQ,
        { id: 'end-red', type: 'end', position: { x: 0, y: 200 }, data: { title: 'You chose Red', description: '', showScore: false, redirectUrl: null } },
        { id: 'end-blue', type: 'end', position: { x: 200, y: 200 }, data: { title: 'You chose Blue', description: '', showScore: false, redirectUrl: null } },
      ];
      const branchEdges: FlowEdge[] = [
        { id: 'e1', source: 'start', target: 'q-2', sourceHandle: null, condition: null },
        { id: 'e2', source: 'q-2', target: 'end-red', sourceHandle: null, condition: { type: 'equals', value: 'Red' } },
        { id: 'e3', source: 'q-2', target: 'end-blue', sourceHandle: null, condition: { type: 'equals', value: 'Blue' } },
      ];

      render(
        <PreviewModal isOpen={true} onClose={vi.fn()} nodes={branchNodes} edges={branchEdges} title="Test" />
      );

      await user.click(screen.getByText('Begin'));
      await user.click(screen.getByText('Red'));
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('You chose Red')).toBeInTheDocument();
    });
  });

  describe('theme application', () => {
    it('applies custom colors from settings', () => {
      render(
        <PreviewModal
          isOpen={true}
          onClose={vi.fn()}
          nodes={linearNodes}
          edges={linearEdges}
          title="Test"
          settings={{ primaryColor: '#FF0000', backgroundColor: '#1a1a1a' } as never}
        />
      );
      // Start screen text should adapt to dark background
      const title = screen.getByText('Welcome');
      expect(title.style.color).toBe('rgb(248, 250, 252)'); // light text on dark bg
    });
  });
});
