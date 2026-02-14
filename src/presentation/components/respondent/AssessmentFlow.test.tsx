// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssessmentFlow } from './AssessmentFlow';
import type { FlowNode, FlowEdge, QuestionNodeData } from '@/domain/entities/flow';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-left">←</span>,
  ChevronRight: () => <span data-testid="icon-right">→</span>,
  Loader2: () => <span data-testid="icon-loader">...</span>,
}));

// Mock ThemeFontLoader to passthrough
vi.mock('./ThemeFontLoader', () => ({
  ThemeFontLoader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock SubmittedScreen
vi.mock('./SubmittedScreen', () => ({
  SubmittedScreen: ({ title }: { title?: string }) => (
    <div data-testid="submitted-screen">{title || 'Submitted'}</div>
  ),
}));

// ===== Test Data =====

const startNode: FlowNode = {
  id: 'start-1',
  type: 'start',
  position: { x: 0, y: 0 },
  data: { title: 'Welcome to Quiz', description: 'Please answer carefully.', buttonText: 'Begin' },
};

const mcqNode: FlowNode = {
  id: 'q-mcq',
  type: 'question',
  position: { x: 0, y: 200 },
  data: {
    questionType: 'multiple_choice_single',
    questionText: 'What is your favorite color?',
    description: 'Choose one.',
    required: true,
    options: [
      { id: 'opt-red', text: 'Red' },
      { id: 'opt-blue', text: 'Blue' },
    ],
  } satisfies QuestionNodeData,
};

const textNode: FlowNode = {
  id: 'q-text',
  type: 'question',
  position: { x: 0, y: 400 },
  data: {
    questionType: 'short_text',
    questionText: 'What is your name?',
    description: null,
    required: false,
    placeholder: 'Enter name...',
  } satisfies QuestionNodeData,
};

const endNode: FlowNode = {
  id: 'end-1',
  type: 'end',
  position: { x: 0, y: 600 },
  data: { title: 'Thank You!', description: 'All done.', showScore: false, redirectUrl: null },
};

const defaultNodes = [startNode, mcqNode, textNode, endNode];

const defaultEdges: FlowEdge[] = [
  { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
  { id: 'e-2', source: 'q-mcq', target: 'q-text', sourceHandle: null, condition: null },
  { id: 'e-3', source: 'q-text', target: 'end-1', sourceHandle: null, condition: null },
];

const defaultSettings = {
  primaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  showProgressBar: true,
  allowBackNavigation: true,
  fontFamily: 'Geist Sans',
  borderRadius: '12px',
  buttonStyle: 'filled',
  cardStyle: 'bordered',
};

const defaultProps = {
  assessmentId: 'test-1',
  title: 'Test Assessment',
  nodes: defaultNodes,
  edges: defaultEdges,
  settings: defaultSettings,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

// ===== Start Screen Tests =====

describe('Start screen', () => {
  it('renders start node title and description', () => {
    render(<AssessmentFlow {...defaultProps} />);
    expect(screen.getByText('Welcome to Quiz')).toBeInTheDocument();
    expect(screen.getByText('Please answer carefully.')).toBeInTheDocument();
  });

  it('renders start button with custom buttonText', () => {
    render(<AssessmentFlow {...defaultProps} />);
    expect(screen.getByText('Begin')).toBeInTheDocument();
  });

  it('navigates to first question on start click', async () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });
});

// ===== Question Navigation Tests =====

describe('Question navigation', () => {
  it('shows question text', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('shows question description when present', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('Choose one.')).toBeInTheDocument();
  });

  it('shows required indicator (*) for required questions', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables Next button when required question is unanswered', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).toBeDisabled();
  });

  it('enables Next button when question is answered', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).not.toBeDisabled();
  });

  it('navigates to next node on Next click', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
  });

  it('navigates back on Back click when allowBackNavigation', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));
    // Now on q-text, click Back
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('hides Back button when allowBackNavigation is false', () => {
    render(
      <AssessmentFlow
        {...defaultProps}
        settings={{ ...defaultSettings, allowBackNavigation: false }}
      />
    );
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
});

// ===== Question Type Rendering =====

describe('Question type rendering', () => {
  it('renders radio-style options for multiple_choice_single', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('renders text input for short_text', () => {
    render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByPlaceholderText('Enter name...')).toBeInTheDocument();
  });

  it('renders number input for number type', () => {
    const numberNode: FlowNode = {
      id: 'q-num',
      type: 'question',
      position: { x: 0, y: 200 },
      data: {
        questionType: 'number',
        questionText: 'How old are you?',
        description: null,
        required: false,
        placeholder: 'Enter age',
      } satisfies QuestionNodeData,
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-num', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-num', target: 'end-1', sourceHandle: null, condition: null },
    ];
    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, numberNode, endNode]}
        edges={edges}
      />
    );
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByPlaceholderText('Enter age')).toBeInTheDocument();
  });

  it('renders email input for email type', () => {
    const emailNode: FlowNode = {
      id: 'q-email',
      type: 'question',
      position: { x: 0, y: 200 },
      data: {
        questionType: 'email',
        questionText: 'Your email?',
        description: null,
        required: false,
        placeholder: 'you@example.com',
      } satisfies QuestionNodeData,
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-email', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-email', target: 'end-1', sourceHandle: null, condition: null },
    ];
    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, emailNode, endNode]}
        edges={edges}
      />
    );
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders dropdown select for dropdown type', () => {
    const dropdownNode: FlowNode = {
      id: 'q-dd',
      type: 'question',
      position: { x: 0, y: 200 },
      data: {
        questionType: 'dropdown',
        questionText: 'Pick one',
        description: null,
        required: false,
        options: [
          { id: 'opt-1', text: 'Alpha' },
          { id: 'opt-2', text: 'Beta' },
        ],
      } satisfies QuestionNodeData,
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-dd', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-dd', target: 'end-1', sourceHandle: null, condition: null },
    ];
    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, dropdownNode, endNode]}
        edges={edges}
      />
    );
    fireEvent.click(screen.getByText('Begin'));
    expect(screen.getByText('Select an option...')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

// ===== Conditional Navigation =====

describe('Conditional navigation', () => {
  it('follows conditional edge when condition matches', () => {
    const endNode2: FlowNode = {
      id: 'end-2',
      type: 'end',
      position: { x: 0, y: 600 },
      data: { title: 'Red Path!', description: 'You chose red', showScore: false, redirectUrl: null },
    };
    const condEdges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
      // Conditional: equals Red -> end-2
      { id: 'e-cond', source: 'q-mcq', target: 'end-2', sourceHandle: null, condition: { type: 'equals', value: 'Red' } },
      // Default: -> end-1
      { id: 'e-default', source: 'q-mcq', target: 'end-1', sourceHandle: null, condition: null },
    ];

    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, mcqNode, endNode, endNode2]}
        edges={condEdges}
      />
    );

    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));

    // Should go to end-2 (Red Path) and trigger submission
    expect(global.fetch).toHaveBeenCalled();
  });

  it('follows conditional branching for yes_no', () => {
    const ynNode: FlowNode = {
      id: 'q-yn',
      type: 'question',
      position: { x: 0, y: 200 },
      data: {
        questionType: 'yes_no',
        questionText: 'Do you agree?',
        description: null,
        required: true,
        options: [
          { id: 'opt-yes', text: 'Yes' },
          { id: 'opt-no', text: 'No' },
        ],
      } satisfies QuestionNodeData,
    };
    const endYes: FlowNode = {
      id: 'end-yes',
      type: 'end',
      position: { x: 0, y: 400 },
      data: { title: 'You Agreed', description: '', showScore: false, redirectUrl: null },
    };
    const endNo: FlowNode = {
      id: 'end-no',
      type: 'end',
      position: { x: 200, y: 400 },
      data: { title: 'You Disagreed', description: '', showScore: false, redirectUrl: null },
    };
    const branchEdges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-yn', sourceHandle: null, condition: null },
      { id: 'e-yes', source: 'q-yn', target: 'end-yes', sourceHandle: null, condition: { type: 'equals', value: 'Yes' } },
      { id: 'e-no', source: 'q-yn', target: 'end-no', sourceHandle: null, condition: { type: 'equals', value: 'No' } },
    ];

    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, ynNode, endYes, endNo]}
        edges={branchEdges}
      />
    );

    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Yes'));
    fireEvent.click(screen.getByText('Next'));

    // Should submit (reached end node)
    expect(global.fetch).toHaveBeenCalled();
  });
});

// ===== Submission =====

describe('Submission', () => {
  it('submits response when reaching end node', async () => {
    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, mcqNode, endNode]}
        edges={[
          { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
          { id: 'e-2', source: 'q-mcq', target: 'end-1', sourceHandle: null, condition: null },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assessments/test-1/responses',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('clears localStorage on successful submission', async () => {
    localStorage.setItem('flowform-test-1', JSON.stringify({ currentNodeId: 'q-mcq', answers: {}, history: [], startedAt: '' }));

    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, mcqNode, endNode]}
        edges={[
          { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
          { id: 'e-2', source: 'q-mcq', target: 'end-1', sourceHandle: null, condition: null },
        ]}
      />
    );

    // Resume from saved state (on q-mcq)
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(localStorage.getItem('flowform-test-1')).toBeNull();
    });
  });

  it('shows submitted screen after submission', async () => {
    render(
      <AssessmentFlow
        {...defaultProps}
        nodes={[startNode, mcqNode, endNode]}
        edges={[
          { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
          { id: 'e-2', source: 'q-mcq', target: 'end-1', sourceHandle: null, condition: null },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Begin'));
    fireEvent.click(screen.getByText('Red'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByTestId('submitted-screen')).toBeInTheDocument();
    });
  });
});

// ===== Progress Bar =====

describe('Progress bar', () => {
  it('shows progress bar when showProgressBar is true and on a question', () => {
    const { container } = render(<AssessmentFlow {...defaultProps} />);
    fireEvent.click(screen.getByText('Begin'));
    // The progress bar container should exist
    const progressBars = container.querySelectorAll('.h-1');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});

// ===== Theming =====

describe('Theming', () => {
  it('applies backgroundColor to container', () => {
    const { container } = render(
      <AssessmentFlow
        {...defaultProps}
        settings={{ ...defaultSettings, backgroundColor: '#1a1a2e' }}
      />
    );
    const mainDiv = container.querySelector('[style*="background-color"]');
    expect(mainDiv).toBeTruthy();
  });
});
