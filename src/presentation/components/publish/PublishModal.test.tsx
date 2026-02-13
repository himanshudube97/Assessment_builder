// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishModal } from './PublishModal';
import type { AssessmentSettings } from '@/domain/entities/assessment';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
  const make = (name: string) => (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
  return {
    X: make('x'),
    Share2: make('share'),
    Calendar: make('calendar'),
    Copy: make('copy'),
    Check: make('check'),
    Globe: make('globe'),
    Lock: make('lock'),
    Loader2: make('loader'),
    ExternalLink: make('external'),
    Users: make('users'),
    Eye: make('eye'),
    EyeOff: make('eye-off'),
    AlertCircle: make('alert-circle'),
    AlertTriangle: make('alert-triangle'),
    Clock: make('clock'),
    Shield: make('shield'),
    Hash: make('hash'),
    Code: make('code'),
    QrCode: make('qr'),
    Link: make('link'),
    Download: make('download'),
    Mail: make('mail'),
    ChevronDown: make('chevron-down'),
    ChevronUp: make('chevron-up'),
    RotateCcw: make('rotate'),
    Pencil: make('pencil'),
    Save: make('save'),
  };
});

vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <svg data-testid="qr-code" />,
}));

vi.mock('./InviteManager', () => ({
  InviteManager: () => <div data-testid="invite-manager" />,
}));

vi.mock('@/lib/share', () => ({
  getShareUrl: (id: string) => `https://flowform.app/s/${id}`,
  copyToClipboard: vi.fn().mockResolvedValue(true),
  getIframeEmbedCode: () => '<iframe src="..."></iframe>',
  getPopupEmbedCode: () => '<script>popup()</script>',
}));

const defaultSettings: AssessmentSettings = {
  primaryColor: '#6366F1',
  backgroundColor: '#ffffff',
  fontFamily: 'Geist Sans',
  borderRadius: '12px',
  buttonStyle: 'filled',
  cardStyle: 'bordered',
  openAt: null,
  closeAt: null,
  maxResponses: null,
  password: null,
  inviteOnly: false,
  showProgressBar: true,
  allowBackNavigation: true,
  redirectUrl: null,
  redirectDelaySeconds: 3,
  scoringEnabled: false,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  assessmentId: 'a-1',
  title: 'My Assessment',
  publishedAt: null as Date | null,
  closeAt: null as Date | null,
  responseCount: 0,
  settings: defaultSettings,
  onPublish: vi.fn().mockResolvedValue({}),
  onCloseAssessment: vi.fn().mockResolvedValue(undefined),
  onUnpublish: vi.fn().mockResolvedValue(undefined),
  onUpdateSettings: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublishModal', () => {
  describe('Draft view', () => {
    it('renders publish button in draft mode', () => {
      render(<PublishModal {...defaultProps} status="draft" />);
      expect(screen.getByText('Publish Assessment')).toBeInTheDocument();
      expect(screen.getByText('Publish Now')).toBeInTheDocument();
    });

    it('shows assessment title', () => {
      render(<PublishModal {...defaultProps} status="draft" />);
      expect(screen.getByText('My Assessment')).toBeInTheDocument();
    });

    it('calls onPublish when Publish Now is clicked', async () => {
      const user = userEvent.setup();
      render(<PublishModal {...defaultProps} status="draft" />);

      await user.click(screen.getByText('Publish Now'));
      await waitFor(() => {
        expect(defaultProps.onPublish).toHaveBeenCalled();
      });
    });

    it('shows validation errors when publish returns them', async () => {
      const user = userEvent.setup();
      const onPublish = vi.fn().mockResolvedValue({
        validationErrors: [
          { type: 'error', message: 'Missing start node' },
          { type: 'warning', message: 'Orphan question' },
        ],
      });

      render(<PublishModal {...defaultProps} status="draft" onPublish={onPublish} />);

      await user.click(screen.getByText('Publish Now'));
      await waitFor(() => {
        expect(screen.getByText('Missing start node')).toBeInTheDocument();
        expect(screen.getByText('Orphan question')).toBeInTheDocument();
      });
    });

    it('shows Advanced Options section', async () => {
      const user = userEvent.setup();
      render(<PublishModal {...defaultProps} status="draft" />);

      expect(screen.getByText('Advanced Options')).toBeInTheDocument();
      await user.click(screen.getByText('Advanced Options'));
      // Should show schedule, access control
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Access Control')).toBeInTheDocument();
    });
  });

  describe('Published view', () => {
    it('renders Live badge and response count', () => {
      render(<PublishModal {...defaultProps} status="published" responseCount={42} />);
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText(/42 responses/)).toBeInTheDocument();
    });

    it('shows share URL in link tab', () => {
      render(<PublishModal {...defaultProps} status="published" />);
      expect(screen.getByDisplayValue('https://flowform.app/s/a-1')).toBeInTheDocument();
    });

    it('shows Back to Draft and Close buttons', () => {
      render(<PublishModal {...defaultProps} status="published" />);
      expect(screen.getByRole('button', { name: /Back to Draft/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close Permanently/ })).toBeInTheDocument();
    });

    it('calls onUnpublish when Back to Draft is clicked', async () => {
      const user = userEvent.setup();
      render(<PublishModal {...defaultProps} status="published" />);

      await user.click(screen.getByRole('button', { name: /Back to Draft/ }));
      await waitFor(() => {
        expect(defaultProps.onUnpublish).toHaveBeenCalled();
      });
    });

    it('calls onCloseAssessment when Close Permanently is clicked', async () => {
      const user = userEvent.setup();
      render(<PublishModal {...defaultProps} status="published" />);

      await user.click(screen.getByText('Close Permanently'));
      await waitFor(() => {
        expect(defaultProps.onCloseAssessment).toHaveBeenCalled();
      });
    });

    it('shows maxResponses in active settings summary', () => {
      render(
        <PublishModal
          {...defaultProps}
          status="published"
          settings={{ ...defaultSettings, maxResponses: 100 }}
        />
      );
      expect(screen.getByText('Max 100 responses')).toBeInTheDocument();
    });

    it('shows password protected badge', () => {
      render(
        <PublishModal
          {...defaultProps}
          status="published"
          settings={{ ...defaultSettings, password: 'hashed' }}
        />
      );
      expect(screen.getByText('Password protected')).toBeInTheDocument();
    });
  });

  describe('Closed view', () => {
    it('renders closed status', () => {
      render(<PublishModal {...defaultProps} status="closed" responseCount={10} />);
      // "Closed" appears in header and badge, so use getAllByText
      expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/10 responses/)).toBeInTheDocument();
      expect(screen.getByText(/permanently closed/)).toBeInTheDocument();
    });

    it('shows Reopen and Back to Draft buttons', () => {
      render(<PublishModal {...defaultProps} status="closed" />);
      // "Reopen" and "Back to Draft" appear in buttons AND in explanation text
      expect(screen.getByRole('button', { name: /Reopen/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Draft/ })).toBeInTheDocument();
    });
  });

  it('returns null when not open', () => {
    const { container } = render(<PublishModal {...defaultProps} isOpen={false} status="draft" />);
    expect(container.innerHTML).toBe('');
  });
});
