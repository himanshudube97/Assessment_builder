'use client';

/**
 * Auth Provider
 * Initializes auth state on mount and provides context
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/presentation/stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const fetchSession = useAuthStore((state) => state.fetchSession);

  useEffect(() => {
    // Fetch session on mount
    fetchSession();
  }, [fetchSession]);

  return <>{children}</>;
}
