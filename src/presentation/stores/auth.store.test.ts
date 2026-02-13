// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './auth.store';
import type { SessionInfo } from '@/domain/entities/auth';

const store = () => useAuthStore.getState();

const mockSession: SessionInfo = {
  user: {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    avatarUrl: null,
  },
  organization: {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    role: 'owner',
    plan: 'free',
  },
  organizations: [
    { id: 'org-1', name: 'Test Org', slug: 'test-org', role: 'owner' },
  ],
};

beforeEach(() => {
  store().setSession(null);
  store().setLoading(false);
  store().setError(null);
  vi.restoreAllMocks();
});

describe('fetchSession', () => {
  it('sets session from /api/auth/me response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSession,
    });
    await store().fetchSession();
    expect(store().session).toEqual(mockSession);
    expect(store().isLoading).toBe(false);
  });

  it('sets session to null on 401 response', async () => {
    store().setSession(mockSession);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    await store().fetchSession();
    expect(store().session).toBeNull();
    expect(store().isLoading).toBe(false);
  });

  it('sets error on failed fetch', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await store().fetchSession();
    expect(store().error).toBe('Network error');
    expect(store().isLoading).toBe(false);
  });

  it('sets isLoading during fetch and clears after', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    const fetchPromise = store().fetchSession();
    expect(store().isLoading).toBe(true);

    resolvePromise!({ ok: true, status: 200, json: async () => mockSession });
    await fetchPromise;
    expect(store().isLoading).toBe(false);
  });
});

describe('logout', () => {
  it('calls POST /api/auth/logout and clears session', async () => {
    // jsdom provides window.location; save and stub href setter
    const hrefSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location);

    store().setSession(mockSession);
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await store().logout();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(store().session).toBeNull();

    hrefSpy.mockRestore();
  });
});

describe('switchOrganization', () => {
  it('calls POST /api/organizations/:orgId/switch', async () => {
    const reloadMock = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload: reloadMock,
    } as unknown as Location);

    store().setSession(mockSession);
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // switch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockSession }); // fetchSession

    await store().switchOrganization('org-2');
    expect(global.fetch).toHaveBeenCalledWith('/api/organizations/org-2/switch', { method: 'POST' });
  });

  it('sets error on failure', async () => {
    store().setSession(mockSession);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    await store().switchOrganization('bad-org');
    expect(store().error).toBe('Not found');
  });

  it('does nothing when no session', async () => {
    global.fetch = vi.fn();
    await store().switchOrganization('org-2');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('selectors', () => {
  it('returns session when set', () => {
    store().setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);
  });

  it('session is non-null when authenticated', () => {
    store().setSession(mockSession);
    expect(useAuthStore.getState().session !== null).toBe(true);
  });

  it('session is null when not authenticated', () => {
    store().setSession(null);
    expect(useAuthStore.getState().session !== null).toBe(false);
  });
});
