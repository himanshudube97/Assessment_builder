'use client';

/**
 * Login Page
 * Sign-in page with Google OAuth and email/password options
 */

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AssessioLogo } from '@/components/ui/logo';
import { GoogleSignInButton } from '@/presentation/components/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case 'oauth_not_configured':
        return 'Google OAuth is not configured. Use email/password login below.';
      case 'oauth_init_failed':
        return 'Failed to start Google sign-in. Try email/password instead.';
      case 'missing_params':
        return 'Invalid callback. Please try again.';
      case 'invalid_state':
        return 'Session expired. Please try again.';
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      case 'access_denied':
        return 'Access was denied. Please try again.';
      default:
        return code ? 'An error occurred. Please try again.' : null;
    }
  };

  const errorMessage = getErrorMessage(error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Login failed');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDevCredentials = () => {
    setEmail('system@flowform.dev');
    setPassword('system123');
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {(errorMessage || formError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{formError || errorMessage}</p>
        </div>
      )}

      {/* Google OAuth */}
      <GoogleSignInButton />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500">or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="
              w-full px-4 py-2.5
              border border-gray-300 rounded-lg
              text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            "
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="
              w-full px-4 py-2.5
              border border-gray-300 rounded-lg
              text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            "
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full px-4 py-2.5
            bg-indigo-600 text-white font-medium rounded-lg
            hover:bg-indigo-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Dev helper */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 text-center">Development mode</p>
          <button
            type="button"
            onClick={fillDevCredentials}
            className="
              w-full px-4 py-2
              bg-gray-100 text-gray-700 text-sm font-medium rounded-lg
              hover:bg-gray-200
              transition-colors
            "
          >
            Fill Dev Credentials
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and heading */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <AssessioLogo className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Assessio</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to create and manage your assessments
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
