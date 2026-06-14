import { create } from 'zustand';
import { api, registerAuthBridge, unwrap } from '@/lib/apiClient';
import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { AuthResponse, AuthUser } from '@/types/models';

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  hydrate: () => Promise<void>;
  setSession: (res: AuthResponse) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  /** Load persisted tokens on launch and resolve the current user. */
  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(STORAGE_KEYS.accessToken),
      getItem(STORAGE_KEYS.refreshToken),
    ]);
    if (!accessToken || !refreshToken) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ accessToken, refreshToken });
    try {
      const me = unwrap<AuthUser>((await api.get('/auth/me')).data);
      set({ user: me, status: 'authenticated' });
    } catch {
      await get().signOut();
    }
  },

  setSession: async (res) => {
    await Promise.all([
      setItem(STORAGE_KEYS.accessToken, res.accessToken),
      setItem(STORAGE_KEYS.refreshToken, res.refreshToken),
    ]);
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      status: 'authenticated',
    });
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      setItem(STORAGE_KEYS.accessToken, accessToken),
      setItem(STORAGE_KEYS.refreshToken, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  refreshUser: async () => {
    const me = unwrap<AuthUser>((await api.get('/auth/me')).data);
    set({ user: me });
  },

  setUser: (user) => set({ user }),

  signOut: async () => {
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    await Promise.all([
      removeItem(STORAGE_KEYS.accessToken),
      removeItem(STORAGE_KEYS.refreshToken),
    ]);
    set({ user: null, accessToken: null, refreshToken: null, status: 'unauthenticated' });
  },
}));

// Wire the API client to the store (token attach + transparent refresh).
registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokens: (accessToken, refreshToken) => useAuthStore.getState().setTokens(accessToken, refreshToken),
  onAuthFailure: () => useAuthStore.getState().signOut(),
});
