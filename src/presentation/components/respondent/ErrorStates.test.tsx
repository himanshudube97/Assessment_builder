// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  NotFoundState,
  ClosedState,
  NotPublishedState,
  ScheduledState,
  InviteRequiredState,
  LoadingState,
} from './ErrorStates';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  FileQuestion: (props: Record<string, unknown>) => <span data-testid="icon-file-question" {...props} />,
  Lock: (props: Record<string, unknown>) => <span data-testid="icon-lock" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => <span data-testid="icon-alert" {...props} />,
  Clock: (props: Record<string, unknown>) => <span data-testid="icon-clock" {...props} />,
  Mail: (props: Record<string, unknown>) => <span data-testid="icon-mail" {...props} />,
}));

describe('NotFoundState', () => {
  it('renders not found message', () => {
    render(<NotFoundState />);
    expect(screen.getByText('Assessment Not Found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or has been removed/)).toBeInTheDocument();
  });
});

describe('ClosedState', () => {
  it('renders closed message', () => {
    render(<ClosedState />);
    expect(screen.getByText('Assessment Closed')).toBeInTheDocument();
    expect(screen.getByText(/no longer accepting responses/)).toBeInTheDocument();
  });
});

describe('NotPublishedState', () => {
  it('renders unavailable message', () => {
    render(<NotPublishedState />);
    expect(screen.getByText('Assessment Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/not currently available/)).toBeInTheDocument();
  });
});

describe('ScheduledState', () => {
  it('renders with a formatted date', () => {
    render(<ScheduledState openAt="2026-03-15T10:00:00Z" />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    // The exact format depends on locale, but it should contain the date
    expect(screen.getByText(/opens on/i)).toBeInTheDocument();
  });

  it('renders fallback when openAt is null', () => {
    render(<ScheduledState openAt={null} />);
    expect(screen.getByText(/not yet open/)).toBeInTheDocument();
  });
});

describe('InviteRequiredState', () => {
  it('renders invite required message', () => {
    render(<InviteRequiredState />);
    expect(screen.getByText('Invitation Required')).toBeInTheDocument();
    expect(screen.getByText(/invite-only/)).toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('renders loading spinner and text', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading assessment...')).toBeInTheDocument();
  });
});
