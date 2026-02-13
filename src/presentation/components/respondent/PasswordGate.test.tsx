// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordGate } from './PasswordGate';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Lock: (props: Record<string, unknown>) => <span data-testid="icon-lock" {...props} />,
  Eye: (props: Record<string, unknown>) => <span data-testid="icon-eye" {...props} />,
  EyeOff: (props: Record<string, unknown>) => <span data-testid="icon-eye-off" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => <span data-testid="icon-alert" {...props} />,
}));

const mockOnVerified = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  sessionStorage.clear();
});

describe('PasswordGate', () => {
  it('renders password form', () => {
    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );
    expect(screen.getByText('Password Required')).toBeInTheDocument();
    expect(screen.getByText(/My Survey/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('shows error when submitting empty password', async () => {
    const user = userEvent.setup();
    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );

    await user.click(screen.getByText('Continue'));
    expect(screen.getByText('Please enter a password')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();
  });

  it('calls onVerified and sets sessionStorage on correct password', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ valid: true }),
    } as Response);

    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'secret');
    await user.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalled();
    });
    expect(sessionStorage.getItem('flowform-pw-a-1')).toBe('verified');
  });

  it('shows error on incorrect password', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ valid: false }),
    } as Response);

    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'wrong');
    await user.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument();
    });
    expect(mockOnVerified).not.toHaveBeenCalled();
  });

  it('shows error on network failure', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'test');
    await user.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <PasswordGate assessmentId="a-1" title="My Survey" onVerified={mockOnVerified} />
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    // Click the toggle button (the Eye icon's parent button)
    const toggleBtn = screen.getByTestId('icon-eye').closest('button')!;
    await user.click(toggleBtn);

    expect(input).toHaveAttribute('type', 'text');
  });
});
