// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmittedScreen } from './SubmittedScreen';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <svg {...props}>{children}</svg>,
    path: (props: Record<string, unknown>) => <path {...props} />,
  },
}));

describe('SubmittedScreen', () => {
  it('renders default title and description', () => {
    render(<SubmittedScreen />);
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
    expect(screen.getByText('Your response has been recorded.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<SubmittedScreen title="All Done" description="See you later!" />);
    expect(screen.getByText('All Done')).toBeInTheDocument();
    expect(screen.getByText('See you later!')).toBeInTheDocument();
  });

  it('shows score when showScore is true', () => {
    render(<SubmittedScreen showScore={true} score={8} maxScore={10} />);
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
  });

  it('hides score when showScore is false', () => {
    render(<SubmittedScreen showScore={false} score={8} maxScore={10} />);
    expect(screen.queryByText('8 / 10')).not.toBeInTheDocument();
  });

  it('hides score when score is null', () => {
    render(<SubmittedScreen showScore={true} score={null} maxScore={10} />);
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });

  it('applies theme colors', () => {
    const { container } = render(
      <SubmittedScreen primaryColor="#FF0000" backgroundColor="#000000" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBe('rgb(0, 0, 0)');
  });
});
