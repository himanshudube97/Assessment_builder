'use client';

/**
 * PasswordGate Component
 * Full-page password form shown before accessing a password-protected assessment
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLightColor, hexWithAlpha } from '@/lib/theme';

interface PasswordGateProps {
  assessmentId: string;
  title: string;
  onVerified: () => void;
  primaryColor?: string;
  backgroundColor?: string;
}

export function PasswordGate({
  assessmentId,
  title,
  onVerified,
  primaryColor = '#6366F1',
  backgroundColor = '#f8fafc',
}: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lightBg = isLightColor(backgroundColor);
  const textColor = lightBg ? '#0f172a' : '#f8fafc';
  const mutedTextColor = lightBg ? '#64748b' : '#94a3b8';
  const inputBg = lightBg ? '#ffffff' : '#1e293b';
  const inputBorder = lightBg ? '#e2e8f0' : '#334155';
  const iconBg = hexWithAlpha(primaryColor, 0.1);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/assessments/${assessmentId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.valid) {
        sessionStorage.setItem(`flowform-pw-${assessmentId}`, 'verified');
        onVerified();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [assessmentId, password, onVerified]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Lock className="h-10 w-10" style={{ color: primaryColor }} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
            Password Required
          </h1>
          <p style={{ color: mutedTextColor }}>
            Enter the password to access <span className="font-medium">{title}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: inputBg,
                color: textColor,
                borderColor: error ? '#EF4444' : inputBorder,
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': primaryColor,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: mutedTextColor }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-red-500"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
              'text-white disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{ backgroundColor: primaryColor }}
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
