import type { PublicUser } from '@shubhmilan/types';
import { create } from 'zustand';

import { api, tokenProvider } from './api';
import { clearKeyPair, ensureKeyPair } from './crypto';

interface AuthState {
  user: PublicUser | null;
  hydrated: boolean;
  setUser: (u: PublicUser | null) => void;
  setHydrated: (v: boolean) => void;
  signOut: () => Promise<void>;
  /**
   * Generate or load the device keypair and make sure the current public key is up-to-date on
   * the server. Safe to call repeatedly; it's a no-op when the server already has our key.
   */
  syncEncryptionKeys: () => Promise<void>;
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
    await clearKeyPair();
    set({ user: null });
  },
  syncEncryptionKeys: async () => {
    try {
      const kp = await ensureKeyPair();
      const remote = await api.me.publicKey().catch(() => ({ publicKey: null }));
      if (remote.publicKey !== kp.publicKey) {
        await api.me.uploadPublicKey(kp.publicKey);
      }
    } catch {
      // Non-fatal — chat will fall back to a "key pending" state.
    }
  },
}));
