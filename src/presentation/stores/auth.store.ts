/**
 * Auth Store
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import type { SessionInfo } from '@/domain/entities/auth';

interface AuthState {
  // State
  session: SessionInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: SessionInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  session: null,
  isLoading: true,
  error: null,

  // Simple setters
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Fetch current session
  fetchSession: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/auth/me');

      if (response.status === 401) {
        set({ session: null, isLoading: false });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const session: SessionInfo = await response.json();
      set({ session, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ session: null, isLoading: false });

      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false,
      });
    }
  },

  // Switch organization
  switchOrganization: async (orgId: string) => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/organizations/${orgId}/switch`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch organization');
      }

      // Refresh session
      await get().fetchSession();

      // Reload page to update all data
      window.location.reload();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Switch failed',
        isLoading: false,
      });
    }
  },
}));

// Selectors for convenience
export const useSession = () => useAuthStore((state) => state.session);
export const useUser = () => useAuthStore((state) => state.session?.user ?? null);
export const useCurrentOrg = () => useAuthStore((state) => state.session?.organization ?? null);
export const useOrganizations = () => useAuthStore((state) => state.session?.organizations ?? []);
export const useIsAuthenticated = () => useAuthStore((state) => state.session !== null);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
