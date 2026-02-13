'use client';

/**
 * PublishModal Component
 * Modal for publishing assessments with share link and close options
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getShareUrl, copyToClipboard } from '@/lib/share';
import type { AssessmentStatus } from '@/domain/entities/assessment';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  title: string;
  status: AssessmentStatus;
  publishedAt: Date | null;
  closeAt: Date | null;
  onPublish: (closeAt?: Date) => Promise<void>;
  onCloseAssessment: () => Promise<void>;
}

export function PublishModal({
  isOpen,
  onClose,
  assessmentId,
  title,
  status,
  publishedAt,
  closeAt: initialCloseAt,
  onPublish,
  onCloseAssessment,
}: PublishModalProps) {
  const [closeAt, setCloseAt] = useState<string>(
    initialCloseAt ? new Date(initialCloseAt).toISOString().slice(0, 16) : ''
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = getShareUrl(assessmentId);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await onPublish(closeAt ? new Date(closeAt) : undefined);
    } finally {
      setIsPublishing(false);
    }
  }, [onPublish, closeAt]);

  const handleClose = useCallback(async () => {
    setIsClosing(true);
    try {
      await onCloseAssessment();
    } finally {
      setIsClosing(false);
    }
  }, [onCloseAssessment]);

  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

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
          className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
          <div className="p-6 space-y-6">
            {status === 'draft' && (
              <>
                {/* End date picker */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    End date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The assessment will automatically stop accepting responses after this date
                  </p>
                </div>

                {/* Publish button */}
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
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
                {/* Share link */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Share link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted text-foreground text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                        copied
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Open link */}
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    'border border-border hover:bg-muted'
                  )}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Assessment
                </a>

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
