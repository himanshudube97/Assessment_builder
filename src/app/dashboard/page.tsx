'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Trash2,
  Loader2,
  Workflow,
  BarChart3,
  Settings,
  LayoutDashboard,
  Search,
  Pencil,
  Sparkles,
  Zap,
  Clock,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assessment } from '@/domain/entities/assessment';
import type { SessionInfo } from '@/domain/entities/auth';
import { useAuthStore, useSession, useIsLoading as useAuthLoading } from '@/presentation/stores/auth.store';

export default function DashboardPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const session = useSession();
  const authLoading = useAuthLoading();
  const fetchSession = useAuthStore((state) => state.fetchSession);
  const logout = useAuthStore((state) => state.logout);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const response = await fetch('/api/assessments');
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setAssessments(data);
        }
      } catch (error) {
        console.error('Error loading assessments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    // Only load assessments when authenticated
    if (session) {
      loadAssessments();
    }
  }, [session, router]);

  const handleCreateAssessment = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Assessment' }),
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const assessment = await response.json();
        router.push(`/dashboard/${assessment.id}/edit`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try {
      const response = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAssessments((prev) => prev.filter((a) => a.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  const filteredAssessments = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: assessments.length,
    published: assessments.filter((a) => a.status === 'published').length,
    totalResponses: assessments.reduce((sum, a) => sum + (a.responseCount || 0), 0),
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssessments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssessments.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar stats={stats} session={session} onLogout={logout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleCreateAssessment}
              disabled={isCreating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'shadow-sm hover:shadow-md',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New Assessment
            </motion.button>

            {/* User Avatar */}
            {session.user.avatarUrl ? (
              <img
                src={session.user.avatarUrl}
                alt={session.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-medium">
                {session.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : assessments.length === 0 ? (
            <EmptyState onCreate={handleCreateAssessment} isCreating={isCreating} />
          ) : (
            <div className="max-w-6xl">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Assessments
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Manage and track all your forms and surveys
                </p>
              </div>

              {/* Table Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {filteredAssessments.length}
                    </span>
                    {filteredAssessments.length === 1 ? 'assessment' : 'assessments'}
                    {selectedIds.size > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400">
                        • {selectedIds.size} selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredAssessments.length && filteredAssessments.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Responses
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="w-20 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <AnimatePresence>
                        {filteredAssessments.map((assessment, index) => (
                          <TableRow
                            key={assessment.id}
                            assessment={assessment}
                            index={index}
                            isSelected={selectedIds.has(assessment.id)}
                            onToggleSelect={() => toggleSelect(assessment.id)}
                            onDelete={handleDelete}
                            onClick={() => router.push(`/dashboard/${assessment.id}/edit`)}
                            onAnalytics={(id) => router.push(`/dashboard/${id}/analytics`)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {filteredAssessments.length === 0 && searchQuery && (
                    <div className="py-12 text-center text-slate-500">
                      No assessments found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({
  stats,
  session,
  onLogout,
}: {
  stats: { total: number; published: number; totalResponses: number };
  session: SessionInfo;
  onLogout: () => void;
}) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: FileText, label: 'Assessments', href: '/dashboard', badge: stats.total },
    { icon: BarChart3, label: 'Responses', href: '/dashboard/responses', badge: stats.totalResponses },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  const userInitials = session.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">FlowForm</span>
        </Link>
      </div>

      {/* Organization */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-xs text-slate-500 uppercase mb-1">Organization</p>
        <p className="text-sm font-medium text-white truncate">{session.organization.name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              item.active
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.label}
            </div>
            {item.badge !== undefined && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                item.active ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Upgrade Card */}
      {session.organization.plan === 'free' && (
        <div className="p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-sm text-indigo-100 mb-3">
              Unlock unlimited forms and advanced features
            </p>
            <button className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {session.user.avatarUrl ? (
            <img
              src={session.user.avatarUrl}
              alt={session.user.name}
              className="w-9 h-9 rounded-full"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-medium">
              {userInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{session.organization.plan} Plan</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// Table Row Component
function TableRow({
  assessment,
  index,
  isSelected,
  onToggleSelect,
  onDelete,
  onClick,
  onAnalytics,
}: {
  assessment: Assessment;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onAnalytics: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    published: { label: 'Live', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400' },
    closed: { label: 'Closed', color: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400' },
    draft: { label: 'Draft', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400' },
  };

  const status = statusConfig[assessment.status as keyof typeof statusConfig] || statusConfig.draft;

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'group cursor-pointer transition-colors',
        isSelected ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
    >
      {/* Checkbox */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>

      {/* Name */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {assessment.title}
            </p>
            {assessment.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {assessment.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', status.color)} />
          <span className={cn('text-sm font-medium', status.textColor)}>
            {status.label}
          </span>
        </div>
      </td>

      {/* Responses */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4" />
          <span className="text-sm">{assessment.responseCount || 0}</span>
        </div>
      </td>

      {/* Updated */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {assessment.updatedAt ? getTimeAgo(assessment.updatedAt) : 'Just now'}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className={cn(
          'flex items-center justify-end gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            onClick={onClick}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {(assessment.responseCount || 0) > 0 && (
            <button
              onClick={() => onAnalytics(assessment.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
              title="Analytics"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => onDelete(assessment.id, e)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// Empty State
function EmptyState({ onCreate, isCreating }: { onCreate: () => void; isCreating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
      </motion.div>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Create your first assessment
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        Build beautiful, branching surveys and quizzes with our visual canvas editor.
      </p>

      <motion.button
        onClick={onCreate}
        disabled={isCreating}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all',
          'bg-indigo-600 text-white hover:bg-indigo-700',
          'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Create Assessment
      </motion.button>
    </div>
  );
}
