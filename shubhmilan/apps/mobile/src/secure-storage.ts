/**
 * Platform-aware secure storage.
 *
 *   • Native (iOS/Android): expo-secure-store, backed by Keychain / Keystore.
 *   • Web: localStorage. The browser has no hardware-backed secret enclave, and any
 *     JS the page runs can read localStorage anyway, so additional client-side
 *     "encryption" with a key the same JS holds is security theater. We rely on
 *     HTTPS + same-origin policy + short-lived access tokens + httpOnly cookies
 *     where possible. Refresh tokens are revocable server-side.
 *
 * The contract is a small async key/value store: get / set / delete. Callers should
 * not assume durability or hardware backing — they should treat it as best-effort
 * persistence with the threat model documented above.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const nativeStorage: SecureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key).catch(() => null),
  setItem: async (key, value) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    await SecureStore.deleteItemAsync(key).catch(() => undefined);
  },
};

const webStorage: SecureStorage = {
  getItem: async (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota or privacy-mode failures — best-effort */
    }
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const secureStorage: SecureStorage =
  Platform.OS === 'web' ? webStorage : nativeStorage;
