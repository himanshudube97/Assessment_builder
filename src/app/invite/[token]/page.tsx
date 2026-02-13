'use client';

/**
 * Invite Page
 * Shows invite details and allows users to accept
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleSignInButton } from '@/presentation/components/auth';
import { useSession, useAuthStore } from '@/presentation/stores/auth.store';

interface InviteDetails {
  id: string;
  email: string;
  role: 'owner' | 'member';
  status: string;
  valid: boolean;
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    name: string;
  };
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const session = useSession();
  const isLoading = useAuthStore((state) => state.isLoading);

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Fetch invite details
  useEffect(() => {
    async function fetchInvite() {
      try {
        const response = await fetch(`/api/invites/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('This invite was not found or has been revoked.');
          } else {
            setError('Failed to load invite details.');
          }
          return;
        }

        const data = await response.json();
        setInvite(data);

        if (!data.valid) {
          if (data.status === 'accepted') {
            setError('This invite has already been accepted.');
          } else if (data.status === 'expired') {
            setError('This invite has expired.');
          } else if (data.status === 'revoked') {
            setError('This invite has been revoked.');
          }
        }
      } catch {
        setError('Failed to load invite details.');
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  // Accept invite (for authenticated users)
  const handleAccept = async () => {
    if (!session || !invite) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to accept invite.');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      setError('Failed to accept invite.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  // Check if user is authenticated with matching email
  const isEmailMatch =
    session?.user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Join {invite.organization.name}
          </h1>
          <p className="mt-2 text-gray-600">
            {invite.inviter.name} has invited you to join as a{' '}
            <span className="font-medium">{invite.role}</span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Invite card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium text-gray-900">{invite.organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Invited as</p>
              <p className="font-medium text-gray-900 capitalize">{invite.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Invited email</p>
              <p className="font-medium text-gray-900">{invite.email}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        {invite.valid ? (
          <div className="space-y-4">
            {session ? (
              isEmailMatch ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="
                    w-full px-6 py-3
                    bg-indigo-600 text-white font-medium rounded-lg
                    hover:bg-indigo-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {accepting ? 'Accepting...' : 'Accept Invite'}
                </button>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg">
                    You&apos;re signed in as <strong>{session.user.email}</strong>, but this
                    invite is for <strong>{invite.email}</strong>. Please sign out and
                    sign in with the correct account.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Sign in with Google to accept this invite
                </p>
                <GoogleSignInButton inviteToken={token} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500">This invite is no longer valid.</p>
          </div>
        )}
      </div>
    </div>
  );
}
