'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmBtnRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-[340px] rounded-xl bg-card border border-border shadow-2xl',
              'p-5'
            )}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-5 pl-12">
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={onConfirm}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'bg-red-500 text-white hover:bg-red-600',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/50'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
