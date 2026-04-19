import type { PublicUser } from '@shubhmilan/types';
import { create } from 'zustand';

import { api, tokenProvider } from './api.js';

interface AuthState {
  user: PublicUser | null;
  hydrated: boolean;
  setUser: (u: PublicUser | null) => void;
  setHydrated: (v: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  signOut: async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    tokenProvider.clearTokens();
    set({ user: null });
  },
}));
