// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasSidebar } from './CanvasSidebar';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, draggable, onDragStart, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div draggable={draggable as boolean} onDragStart={onDragStart as React.DragEventHandler} {...props}>
        {children}
      </div>
    ),
  },
}));

vi.mock('lucide-react', () => {
  const make = (name: string) => (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
  return {
    CircleDot: make('circle-dot'),
    CheckSquare: make('check-square'),
    Type: make('type'),
    AlignLeft: make('align-left'),
    Star: make('star'),
    ToggleLeft: make('toggle-left'),
    Flag: make('flag'),
    GripVertical: make('grip'),
    Hash: make('hash'),
    Mail: make('mail'),
    ChevronDown: make('chevron-down'),
    Calendar: make('calendar'),
    Gauge: make('gauge'),
  };
});

describe('CanvasSidebar', () => {
  const mockOnAddNode = vi.fn();

  beforeEach(() => {
    mockOnAddNode.mockClear();
  });

  it('renders all 11 question types', () => {
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);

    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('Checkboxes')).toBeInTheDocument();
    expect(screen.getByText('Short Text')).toBeInTheDocument();
    expect(screen.getByText('Long Text')).toBeInTheDocument();
    expect(screen.getByText('Rating Scale')).toBeInTheDocument();
    expect(screen.getByText('Yes / No')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('NPS Score')).toBeInTheDocument();
  });

  it('renders End Screen option', () => {
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);
    expect(screen.getByText('End Screen')).toBeInTheDocument();
  });

  it('calls onAddNode with question type when clicked', async () => {
    const user = userEvent.setup();
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);

    await user.click(screen.getByText('Short Text'));
    expect(mockOnAddNode).toHaveBeenCalledWith('question', 'short_text');
  });

  it('calls onAddNode with end type when End Screen is clicked', async () => {
    const user = userEvent.setup();
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);

    await user.click(screen.getByText('End Screen'));
    expect(mockOnAddNode).toHaveBeenCalledWith('end');
  });

  it('shows "Flow is locked" when disabled', () => {
    render(<CanvasSidebar onAddNode={mockOnAddNode} disabled={true} />);
    expect(screen.getByText('Flow is locked')).toBeInTheDocument();
  });

  it('does not call onAddNode when disabled', async () => {
    const user = userEvent.setup();
    render(<CanvasSidebar onAddNode={mockOnAddNode} disabled={true} />);

    // The items have pointer-events-none via CSS, but the click handler also checks disabled
    await user.click(screen.getByText('Short Text'));
    expect(mockOnAddNode).not.toHaveBeenCalled();
  });

  it('shows drag hint text when not disabled', () => {
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);
    expect(screen.getByText('Drag to canvas or click to add')).toBeInTheDocument();
  });

  it('renders descriptions for question types', () => {
    render(<CanvasSidebar onAddNode={mockOnAddNode} />);
    expect(screen.getByText('Select one option')).toBeInTheDocument();
    expect(screen.getByText('Paragraph answer')).toBeInTheDocument();
    expect(screen.getByText('0-10 loyalty scale')).toBeInTheDocument();
  });
});
