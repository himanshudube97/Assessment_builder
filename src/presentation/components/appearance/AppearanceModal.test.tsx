// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppearanceModal } from './AppearanceModal';
import type { AssessmentSettings } from '@/domain/entities/assessment';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <span data-testid="icon-x" {...props} />,
  Palette: (props: Record<string, unknown>) => <span data-testid="icon-palette" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
}));

// Mock child components to keep tests focused
vi.mock('./TemplateGrid', () => ({
  TemplateGrid: ({ onSelect }: { currentSettings: unknown; onSelect: (v: unknown) => void }) => (
    <div data-testid="template-grid">
      <button onClick={() => onSelect({ primaryColor: '#FF5500' })}>Select Template</button>
    </div>
  ),
}));

vi.mock('./CustomThemePanel', () => ({
  CustomThemePanel: ({ onChange }: { settings: unknown; onChange: (v: unknown) => void }) => (
    <div data-testid="custom-panel">
      <button onClick={() => onChange({ fontFamily: 'Inter' })}>Change Font</button>
    </div>
  ),
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

describe('AppearanceModal', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when not open', () => {
    const { container } = render(
      <AppearanceModal isOpen={false} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal with header and tabs', () => {
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
    expect(screen.getByText('Apply Theme')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows Templates tab by default', () => {
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );
    expect(screen.getByTestId('template-grid')).toBeInTheDocument();
  });

  it('switches to Customize tab', async () => {
    const user = userEvent.setup();
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );

    await user.click(screen.getByText('Customize'));
    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
  });

  it('calls onApply with pending settings and closes', async () => {
    const user = userEvent.setup();
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );

    // Select a template to update pending state
    await user.click(screen.getByText('Select Template'));
    await user.click(screen.getByText('Apply Theme'));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith(
        expect.objectContaining({ primaryColor: '#FF5500' })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('accumulates changes from Customize tab', async () => {
    const user = userEvent.setup();
    render(
      <AppearanceModal isOpen={true} onClose={mockOnClose} currentSettings={defaultSettings} onApply={mockOnApply} />
    );

    await user.click(screen.getByText('Customize'));
    await user.click(screen.getByText('Change Font'));
    await user.click(screen.getByText('Apply Theme'));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith(
        expect.objectContaining({ fontFamily: 'Inter' })
      );
    });
  });
});
