'use client';

/**
 * Error State Components for Public Assessment Pages
 */

import { motion } from 'framer-motion';
import { FileQuestion, Lock, AlertCircle, Clock, Mail } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function ErrorStateBase({ title, description, icon }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
        >
          {icon}
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
      </motion.div>
    </div>
  );
}

export function NotFoundState() {
  return (
    <ErrorStateBase
      title="Assessment Not Found"
      description="The assessment you're looking for doesn't exist or has been removed."
      icon={<FileQuestion className="h-10 w-10 text-slate-400" />}
    />
  );
}

export function ClosedState() {
  return (
    <ErrorStateBase
      title="Assessment Closed"
      description="This assessment is no longer accepting responses."
      icon={<Lock className="h-10 w-10 text-slate-400" />}
    />
  );
}

export function NotPublishedState() {
  return (
    <ErrorStateBase
      title="Assessment Unavailable"
      description="This assessment is not currently available."
      icon={<AlertCircle className="h-10 w-10 text-slate-400" />}
    />
  );
}

export function ScheduledState({ openAt }: { openAt?: string | null }) {
  const formattedDate = openAt
    ? new Date(openAt).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <ErrorStateBase
      title="Coming Soon"
      description={
        formattedDate
          ? `This assessment opens on ${formattedDate}`
          : 'This assessment is not yet open.'
      }
      icon={<Clock className="h-10 w-10 text-slate-400" />}
    />
  );
}

export function InviteRequiredState() {
  return (
    <ErrorStateBase
      title="Invitation Required"
      description="This assessment is invite-only. Please use the link provided in your invitation."
      icon={<Mail className="h-10 w-10 text-slate-400" />}
    />
  );
}

export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-slate-200 border-t-indigo-600 rounded-full"
          style={{ borderWidth: 3 }}
        />
        <p className="text-slate-500 dark:text-slate-400">Loading assessment...</p>
      </motion.div>
    </div>
  );
}
