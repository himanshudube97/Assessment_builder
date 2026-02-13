'use client';

/**
 * PublishModal Component
 * Modal for publishing assessments with settings, share link, embed, QR, and close options
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Share2,
  Calendar,
  Copy,
  Check,
  Globe,
  Lock,
  Loader2,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Clock,
  Shield,
  Hash,
  Code,
  QrCode,
  Link,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getShareUrl,
  copyToClipboard,
  getIframeEmbedCode,
  getPopupEmbedCode,
} from '@/lib/share';
import type { AssessmentStatus, AssessmentSettings } from '@/domain/entities/assessment';
import type { FlowValidationError } from '@/domain/entities/flow';

export interface PublishSettings {
  closeAt?: Date;
  openAt?: Date;
  maxResponses?: number | null;
  password?: string | null;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  title: string;
  status: AssessmentStatus;
  publishedAt: Date | null;
  closeAt: Date | null;
  responseCount: number;
  settings: AssessmentSettings | null;
  onPublish: (settings: PublishSettings) => Promise<{ validationErrors?: FlowValidationError[] }>;
  onCloseAssessment: () => Promise<void>;
}

type ShareTab = 'link' | 'embed' | 'qr';

export function PublishModal({
  isOpen,
  onClose,
  assessmentId,
  title,
  status,
  publishedAt,
  closeAt: initialCloseAt,
  responseCount,
  settings,
  onPublish,
  onCloseAssessment,
}: PublishModalProps) {
  // Form state
  const [openAt, setOpenAt] = useState<string>('');
  const [closeAt, setCloseAt] = useState<string>('');
  const [maxResponses, setMaxResponses] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FlowValidationError[]>([]);
  const [shareTab, setShareTab] = useState<ShareTab>('link');

  const shareUrl = getShareUrl(assessmentId);

  // Initialize form values from existing settings when modal opens
  useEffect(() => {
    if (isOpen && settings) {
      setOpenAt(settings.openAt ? new Date(settings.openAt).toISOString().slice(0, 16) : '');
      setCloseAt(settings.closeAt ? new Date(settings.closeAt).toISOString().slice(0, 16) : '');
      setMaxResponses(settings.maxResponses ? String(settings.maxResponses) : '');
      setPassword('');
    } else if (isOpen) {
      setOpenAt('');
      setCloseAt(initialCloseAt ? new Date(initialCloseAt).toISOString().slice(0, 16) : '');
      setMaxResponses('');
      setPassword('');
    }
    setValidationErrors([]);
    setCopied(null);
    setShareTab('link');
  }, [isOpen, settings, initialCloseAt]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    setValidationErrors([]);
    try {
      const publishSettings: PublishSettings = {};

      if (closeAt) publishSettings.closeAt = new Date(closeAt);
      if (openAt) publishSettings.openAt = new Date(openAt);
      if (maxResponses) publishSettings.maxResponses = parseInt(maxResponses, 10);
      if (password) publishSettings.password = password;

      const result = await onPublish(publishSettings);

      if (result?.validationErrors?.length) {
        setValidationErrors(result.validationErrors);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [onPublish, closeAt, openAt, maxResponses, password]);

  const handleClose = useCallback(async () => {
    setIsClosing(true);
    try {
      await onCloseAssessment();
    } finally {
      setIsClosing(false);
    }
  }, [onCloseAssessment]);

  const handleCopy = useCallback(async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const hasBlockingErrors = validationErrors.some((e) => e.type === 'error');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                status === 'published' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
              )}>
                {status === 'published' ? (
                  <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : status === 'closed' ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Share2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {status === 'published' ? 'Published' : status === 'closed' ? 'Closed' : 'Publish Assessment'}
                </h2>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {status === 'draft' && (
              <>
                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <div className={cn(
                    'p-4 rounded-lg border space-y-2',
                    hasBlockingErrors
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  )}>
                    <div className={cn(
                      'flex items-center gap-2 font-medium text-sm',
                      hasBlockingErrors
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                    )}>
                      {hasBlockingErrors ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {hasBlockingErrors ? 'Fix these issues before publishing' : 'Warnings'}
                    </div>
                    <ul className="space-y-1">
                      {validationErrors.map((err, i) => (
                        <li
                          key={i}
                          className={cn(
                            'text-sm flex items-start gap-2',
                            err.type === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          <span className="mt-0.5">•</span>
                          {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Schedule section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Schedule
                  </h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Start date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={openAt}
                      onChange={(e) => setOpenAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      End date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={closeAt}
                      onChange={(e) => setCloseAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Access control section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Access Control
                  </h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Response limit (optional)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="number"
                        min="1"
                        value={maxResponses}
                        onChange={(e) => setMaxResponses(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Password protection (optional)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="No password"
                        className="w-full pl-9 pr-10 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {settings?.password && !password && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently password protected. Leave empty to keep existing password.
                      </p>
                    )}
                  </div>
                </div>

                {/* Publish button */}
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || hasBlockingErrors}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isPublishing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Globe className="h-5 w-5" />
                  )}
                  Publish Assessment
                </button>
              </>
            )}

            {(status === 'published' || status === 'closed') && (
              <>
                {/* Response count */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                    </span>
                    {settings?.maxResponses && (
                      <span className="text-sm text-muted-foreground">
                        {' '}/ {settings.maxResponses} max
                      </span>
                    )}
                  </div>
                </div>

                {/* Share tabs */}
                <div className="space-y-4">
                  <div className="flex gap-1 p-1 rounded-lg bg-muted">
                    {([
                      { key: 'link' as const, label: 'Link', icon: Link },
                      { key: 'embed' as const, label: 'Embed', icon: Code },
                      { key: 'qr' as const, label: 'QR Code', icon: QrCode },
                    ]).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setShareTab(key)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                          shareTab === key
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Link tab */}
                  {shareTab === 'link' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted text-foreground text-sm"
                        />
                        <button
                          onClick={() => handleCopy(shareUrl, 'link')}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                            copied === 'link'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}
                        >
                          {copied === 'link' ? (
                            <><Check className="h-4 w-4" /> Copied</>
                          ) : (
                            <><Copy className="h-4 w-4" /> Copy</>
                          )}
                        </button>
                      </div>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border border-border hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Assessment
                      </a>
                    </div>
                  )}

                  {/* Embed tab */}
                  {shareTab === 'embed' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Inline embed
                        </label>
                        <div className="relative">
                          <pre className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                            {getIframeEmbedCode(assessmentId)}
                          </pre>
                          <button
                            onClick={() => handleCopy(getIframeEmbedCode(assessmentId), 'iframe')}
                            className={cn(
                              'absolute top-2 right-2 p-1.5 rounded-md transition-all',
                              copied === 'iframe'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                            )}
                          >
                            {copied === 'iframe' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Popup button
                        </label>
                        <div className="relative">
                          <pre className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                            {getPopupEmbedCode(assessmentId)}
                          </pre>
                          <button
                            onClick={() => handleCopy(getPopupEmbedCode(assessmentId), 'popup')}
                            className={cn(
                              'absolute top-2 right-2 p-1.5 rounded-md transition-all',
                              copied === 'popup'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                            )}
                          >
                            {copied === 'popup' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code tab */}
                  {shareTab === 'qr' && (
                    <QRCodePanel shareUrl={shareUrl} />
                  )}
                </div>

                {/* Status info */}
                {status === 'published' && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Live</span>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                      Your assessment is accepting responses
                      {initialCloseAt && (
                        <> until {new Date(initialCloseAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                )}

                {status === 'closed' && (
                  <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">Closed</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      This assessment is no longer accepting responses
                    </p>
                  </div>
                )}

                {/* Active settings summary */}
                {settings && status === 'published' && (
                  <ActiveSettingsSummary settings={settings} />
                )}

                {/* Close button (only for published) */}
                {status === 'published' && (
                  <button
                    onClick={handleClose}
                    disabled={isClosing}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      'border border-destructive text-destructive',
                      'hover:bg-destructive/10',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isClosing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Close Assessment
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * QR Code panel with download functionality
 */
function QRCodePanel({ shareUrl }: { shareUrl: string }) {
  const [qrSize, setQrSize] = useState<'sm' | 'md' | 'lg'>('md');
  const qrRef = useRef<HTMLDivElement>(null);

  const sizeMap = { sm: 128, md: 200, lg: 280 };
  const size = sizeMap[qrSize];

  const handleDownload = useCallback(() => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const downloadSize = sizeMap.lg * 2; // High-res download
    canvas.width = downloadSize;
    canvas.height = downloadSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, downloadSize, downloadSize);
      ctx.drawImage(img, 0, 0, downloadSize, downloadSize);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowform-qr-code.png';
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={qrRef} className="p-4 bg-white rounded-lg">
        <QRCodeSVG
          value={shareUrl}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Size selector */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setQrSize(s)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-all',
              qrSize === s
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
          </button>
        ))}
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border border-border hover:bg-muted"
      >
        <Download className="h-4 w-4" />
        Download PNG
      </button>
    </div>
  );
}

/**
 * Compact summary of active publish settings
 */
function ActiveSettingsSummary({ settings }: { settings: AssessmentSettings }) {
  const items: { icon: React.ReactNode; label: string }[] = [];

  if (settings.password) {
    items.push({ icon: <Lock className="h-3.5 w-3.5" />, label: 'Password protected' });
  }
  if (settings.openAt) {
    items.push({
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: `Opens ${new Date(settings.openAt).toLocaleDateString()}`,
    });
  }
  if (settings.closeAt) {
    items.push({
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: `Closes ${new Date(settings.closeAt).toLocaleDateString()}`,
    });
  }
  if (settings.maxResponses) {
    items.push({
      icon: <Hash className="h-3.5 w-3.5" />,
      label: `Max ${settings.maxResponses} responses`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Settings
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
          >
            {item.icon}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
