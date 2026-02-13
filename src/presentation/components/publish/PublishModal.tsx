'use client';

/**
 * PublishModal Component
 * Modal for publishing, managing, and sharing assessments
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
  Mail,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Pencil,
  Save,
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
import { InviteManager } from './InviteManager';

export interface PublishSettings {
  closeAt?: Date;
  openAt?: Date;
  maxResponses?: number | null;
  password?: string | null;
  inviteOnly?: boolean;
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
  onUnpublish: () => Promise<void>;
  onUpdateSettings: (settings: Partial<AssessmentSettings>) => Promise<void>;
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
  onUnpublish,
  onUpdateSettings,
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
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FlowValidationError[]>([]);
  const [shareTab, setShareTab] = useState<ShareTab>('link');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const shareUrl = getShareUrl(assessmentId);

  // Initialize form values only when modal transitions from closed → open
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened) return;

    if (settings) {
      setOpenAt(settings.openAt ? new Date(settings.openAt).toISOString().slice(0, 16) : '');
      setCloseAt(settings.closeAt ? new Date(settings.closeAt).toISOString().slice(0, 16) : '');
      setMaxResponses(settings.maxResponses ? String(settings.maxResponses) : '');
      setPassword('');
    } else {
      setOpenAt('');
      setCloseAt(initialCloseAt ? new Date(initialCloseAt).toISOString().slice(0, 16) : '');
      setMaxResponses('');
      setPassword('');
    }
    setValidationErrors([]);
    setCopied(null);
    setShareTab('link');
    setShowAdvanced(false);
    setSettingsSaved(false);
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

  const handleUnpublish = useCallback(async () => {
    setIsUnpublishing(true);
    try {
      await onUnpublish();
    } finally {
      setIsUnpublishing(false);
    }
  }, [onUnpublish]);

  const handleSaveSettings = useCallback(async () => {
    setIsSavingSettings(true);
    setSettingsSaved(false);
    try {
      const update: Partial<AssessmentSettings> = {};

      update.openAt = openAt ? new Date(openAt) : null;
      update.closeAt = closeAt ? new Date(closeAt) : null;
      update.maxResponses = maxResponses ? parseInt(maxResponses, 10) : null;

      await onUpdateSettings(update);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally {
      setIsSavingSettings(false);
    }
  }, [onUpdateSettings, openAt, closeAt, maxResponses]);

  const handleCopy = useCallback(async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const handleToggleInviteOnly = useCallback(async (enabled: boolean) => {
    try {
      await onUpdateSettings({ inviteOnly: enabled });
    } catch (err) {
      console.error('Failed to update invite-only setting:', err);
    }
  }, [onUpdateSettings]);

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
          className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                status === 'published'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-muted'
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
                <p className="text-sm text-muted-foreground truncate max-w-[280px]">
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

            {/* ===== DRAFT VIEW ===== */}
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
                          <span className="mt-0.5">&bull;</span>
                          {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Simple publish — just one big button */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Make your assessment live and start collecting responses.
                  </p>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || hasBlockingErrors}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-base',
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
                    Publish Now
                  </button>
                </div>

                {/* Advanced options — collapsed by default */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span>Advanced Options</span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          <SettingsForm
                            openAt={openAt}
                            setOpenAt={setOpenAt}
                            closeAt={closeAt}
                            setCloseAt={setCloseAt}
                            maxResponses={maxResponses}
                            setMaxResponses={setMaxResponses}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            hasExistingPassword={!!settings?.password}
                          />

                          {/* Invite-Only Mode */}
                          <InviteManager
                            assessmentId={assessmentId}
                            inviteOnly={settings?.inviteOnly ?? false}
                            onToggleInviteOnly={handleToggleInviteOnly}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* ===== PUBLISHED VIEW ===== */}
            {status === 'published' && (
              <>
                {/* Live badge + response count */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <div className="relative">
                      <Globe className="h-4 w-4" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <span className="font-medium text-sm">Live</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                      {settings?.maxResponses && <> / {settings.maxResponses} max</>}
                    </span>
                  </div>
                </div>

                {/* Share tabs */}
                <ShareTabs
                  shareTab={shareTab}
                  setShareTab={setShareTab}
                  shareUrl={shareUrl}
                  assessmentId={assessmentId}
                  settings={settings}
                  copied={copied}
                  onCopy={handleCopy}
                />

                {/* Editable settings */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Settings
                    </span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          <SettingsForm
                            openAt={openAt}
                            setOpenAt={setOpenAt}
                            closeAt={closeAt}
                            setCloseAt={setCloseAt}
                            maxResponses={maxResponses}
                            setMaxResponses={setMaxResponses}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            hasExistingPassword={!!settings?.password}
                          />

                          {/* Invite-Only Mode */}
                          <InviteManager
                            assessmentId={assessmentId}
                            inviteOnly={settings?.inviteOnly ?? false}
                            onToggleInviteOnly={handleToggleInviteOnly}
                          />

                          <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                              settingsSaved
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90',
                              'disabled:opacity-50'
                            )}
                          >
                            {isSavingSettings ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : settingsSaved ? (
                              <><Check className="h-4 w-4" /> Settings Saved</>
                            ) : (
                              <><Save className="h-4 w-4" /> Save Settings</>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active settings summary */}
                {settings && <ActiveSettingsSummary settings={settings} />}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUnpublish}
                    disabled={isUnpublishing || isClosing}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                      'border border-border text-muted-foreground',
                      'hover:bg-muted hover:text-foreground',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isUnpublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Back to Draft
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={isClosing || isUnpublishing}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
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
                    Close Permanently
                  </button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  <strong>Back to Draft</strong> takes it offline temporarily so you can edit and republish. <strong>Close</strong> ends data collection permanently.
                </p>
              </>
            )}

            {/* ===== CLOSED VIEW ===== */}
            {status === 'closed' && (
              <>
                {/* Closed badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm">Closed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  This assessment has been permanently closed and is no longer accepting responses.
                </p>

                {/* Share tabs */}
                <ShareTabs
                  shareTab={shareTab}
                  setShareTab={setShareTab}
                  shareUrl={shareUrl}
                  assessmentId={assessmentId}
                  settings={settings}
                  copied={copied}
                  onCopy={handleCopy}
                />

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || isUnpublishing}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
                      'bg-primary text-primary-foreground',
                      'hover:bg-primary/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    Reopen
                  </button>
                  <button
                    onClick={handleUnpublish}
                    disabled={isUnpublishing || isPublishing}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
                      'border border-border text-muted-foreground',
                      'hover:bg-muted hover:text-foreground',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isUnpublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Back to Draft
                  </button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  <strong>Reopen</strong> resumes collecting responses. <strong>Back to Draft</strong> takes it offline so you can edit and republish.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Settings Form (reused in draft & published views)
// ============================================

interface SettingsFormProps {
  openAt: string;
  setOpenAt: (v: string) => void;
  closeAt: string;
  setCloseAt: (v: string) => void;
  maxResponses: string;
  setMaxResponses: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  hasExistingPassword: boolean;
}

function SettingsForm({
  openAt,
  setOpenAt,
  closeAt,
  setCloseAt,
  maxResponses,
  setMaxResponses,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  hasExistingPassword,
}: SettingsFormProps) {
  return (
    <>
      {/* Schedule */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Schedule
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
            <input
              type="datetime-local"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End date</label>
            <input
              type="datetime-local"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Access control */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Access Control
        </h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Response limit</label>
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
          <label className="text-xs text-muted-foreground mb-1 block">Password protection</label>
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
          {hasExistingPassword && !password && (
            <p className="text-xs text-muted-foreground mt-1">
              Currently password protected. Leave empty to keep existing.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================
// Share Tabs (reused in published & closed views)
// ============================================

interface ShareTabsProps {
  shareTab: ShareTab;
  setShareTab: (tab: ShareTab) => void;
  shareUrl: string;
  assessmentId: string;
  settings: AssessmentSettings | null;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function ShareTabs({ shareTab, setShareTab, shareUrl, assessmentId, settings, copied, onCopy }: ShareTabsProps) {
  return (
    <div className="space-y-3">
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
              onClick={() => onCopy(shareUrl, 'link')}
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
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border border-border hover:bg-muted text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Open Assessment
          </a>
        </div>
      )}

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
                onClick={() => onCopy(getIframeEmbedCode(assessmentId), 'iframe')}
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
                {getPopupEmbedCode(assessmentId, settings?.primaryColor)}
              </pre>
              <button
                onClick={() => onCopy(getPopupEmbedCode(assessmentId), 'popup')}
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

      {shareTab === 'qr' && <QRCodePanel shareUrl={shareUrl} />}
    </div>
  );
}

// ============================================
// QR Code Panel
// ============================================

function QRCodePanel({ shareUrl }: { shareUrl: string }) {
  const [qrSize, setQrSize] = useState<'sm' | 'md' | 'lg'>('md');
  const qrRef = useRef<HTMLDivElement>(null);

  const sizeMap = { sm: 128, md: 200, lg: 280 };
  const size = sizeMap[qrSize];

  const handleDownload = useCallback(() => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const downloadSize = sizeMap.lg * 2;
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
        <QRCodeSVG value={shareUrl} size={size} level="M" includeMargin={false} />
      </div>

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

      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border border-border hover:bg-muted text-sm"
      >
        <Download className="h-4 w-4" />
        Download PNG
      </button>
    </div>
  );
}

// ============================================
// Active Settings Summary
// ============================================

function ActiveSettingsSummary({ settings }: { settings: AssessmentSettings }) {
  const items: { icon: React.ReactNode; label: string }[] = [];

  if (settings.inviteOnly) {
    items.push({ icon: <Mail className="h-3.5 w-3.5" />, label: 'Invite only' });
  }
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
        Active Settings
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
