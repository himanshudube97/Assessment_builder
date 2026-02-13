'use client';

/**
 * InviteManager Component
 * Manages invite-only mode toggle, invite creation, and invite list
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Mail,
  Link2,
  Trash2,
  Copy,
  Check,
  Plus,
  Users,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/share';

interface InviteListItem {
  id: string;
  email: string | null;
  token: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  link: string;
}

interface InviteManagerProps {
  assessmentId: string;
  inviteOnly: boolean;
  onToggleInviteOnly: (enabled: boolean) => Promise<void>;
}

export function InviteManager({
  assessmentId,
  inviteOnly: inviteOnlyProp,
  onToggleInviteOnly,
}: InviteManagerProps) {
  const [inviteOnly, setInviteOnly] = useState(inviteOnlyProp);
  const [invites, setInvites] = useState<InviteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [createMode, setCreateMode] = useState<'anonymous' | 'email'>('anonymous');
  const [count, setCount] = useState('5');
  const [emails, setEmails] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [copied, setCopied] = useState<string | null>(null);

  // Sync with prop changes (e.g. when modal reopens with fresh data)
  useEffect(() => {
    setInviteOnly(inviteOnlyProp);
  }, [inviteOnlyProp]);

  const fetchInvites = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/invites`);
      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (inviteOnly) {
      fetchInvites();
    }
  }, [inviteOnly, fetchInvites]);

  const handleToggle = useCallback(async () => {
    const newValue = !inviteOnly;
    setInviteOnly(newValue); // Optimistic update
    setIsToggling(true);
    try {
      await onToggleInviteOnly(newValue);
    } catch {
      setInviteOnly(!newValue); // Revert on error
    } finally {
      setIsToggling(false);
    }
  }, [inviteOnly, onToggleInviteOnly]);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      const body: Record<string, unknown> = {
        maxUses: parseInt(maxUses, 10) || 1,
      };

      if (createMode === 'email' && emails.trim()) {
        body.emails = emails
          .split(/[,\n]/)
          .map((e) => e.trim())
          .filter(Boolean);
      } else {
        body.count = parseInt(count, 10) || 1;
      }

      const response = await fetch(`/api/assessments/${assessmentId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setEmails('');
        await fetchInvites();
      }
    } catch (err) {
      console.error('Error creating invites:', err);
    } finally {
      setIsCreating(false);
    }
  }, [assessmentId, createMode, count, emails, maxUses, fetchInvites]);

  const handleRevoke = useCallback(
    async (inviteId: string) => {
      try {
        const response = await fetch(
          `/api/assessments/${assessmentId}/invites/${inviteId}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        }
      } catch (err) {
        console.error('Error revoking invite:', err);
      }
    },
    [assessmentId]
  );

  const handleCopyLink = useCallback(async (link: string, id: string) => {
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Invite Only
        </h3>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            inviteOnly ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              inviteOnly ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {inviteOnly && (
        <div className="space-y-4 pt-1">
          {/* Create invites */}
          <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex gap-1 p-0.5 rounded-md bg-muted">
              {([
                { key: 'anonymous' as const, label: 'Links', icon: Link2 },
                { key: 'email' as const, label: 'Emails', icon: Mail },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCreateMode(key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                    createMode === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {createMode === 'anonymous' ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Number of links
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Uses per link
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Email addresses (comma or newline separated)
                  </label>
                  <textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="alice@example.com, bob@example.com"
                    rows={3}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Uses per invite
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={isCreating || (createMode === 'email' && !emails.trim())}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Generate Invites
            </button>
          </div>

          {/* Invite list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Invites ({invites.length})
              </span>
              {isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>

            {invites.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground py-3 text-center">
                No invites yet. Generate some above.
              </p>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 p-2 rounded-md border border-border bg-background text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {invite.email ? (
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-foreground truncate text-xs">
                        {invite.email || 'Anonymous link'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {invite.usedCount}/{invite.maxUses} used
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyLink(invite.link, invite.id)}
                    className={cn(
                      'p-1 rounded transition-all shrink-0',
                      copied === invite.id
                        ? 'text-emerald-600'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Copy invite link"
                  >
                    {copied === invite.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-all shrink-0"
                    title="Revoke invite"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
