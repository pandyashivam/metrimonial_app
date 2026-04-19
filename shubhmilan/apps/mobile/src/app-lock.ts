import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * App-lock / biometric re-auth. When the setting is enabled, the app requires a Face ID /
 * Touch ID / device passcode unlock when it comes back to the foreground. The setting is
 * opt-in (off by default) and stored in SecureStore so it survives app restarts.
 *
 * Implementation notes:
 *   - Works on native (iOS/Android) via expo-local-authentication's hardware prompt.
 *   - On web there's no hardware biometric — we fall through to the session token check,
 *     so the app-lock toggle is hidden on the web build.
 *   - First-time bootstrap: if hardware isn't enrolled, we silently no-op so we don't
 *     brick the user out.
 */

const SETTING_KEY = 'shubhmilan.applock.enabled';

interface LockState {
  enabled: boolean;
  locked: boolean;
  setEnabled: (on: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
  lock: () => void;
  tryUnlock: () => Promise<boolean>;
}

export const useAppLock = create<LockState>((set, get) => ({
  enabled: false,
  locked: false,
  hydrate: async () => {
    if (Platform.OS === 'web') return;
    const stored = await SecureStore.getItemAsync(SETTING_KEY).catch(() => null);
    const enabled = stored === 'true';
    set({ enabled, locked: enabled });
    if (enabled) await get().tryUnlock();
  },
  setEnabled: async (on) => {
    if (Platform.OS === 'web') return;
    if (on) {
      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!supported || !enrolled) {
        throw new Error('No biometric or device passcode configured on this device');
      }
    }
    await SecureStore.setItemAsync(SETTING_KEY, on ? 'true' : 'false');
    set({ enabled: on });
  },
  lock: () => {
    if (get().enabled) set({ locked: true });
  },
  tryUnlock: async () => {
    if (Platform.OS === 'web') {
      set({ locked: false });
      return true;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock ShubhMilan',
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
    });
    if (res.success) {
      set({ locked: false });
      return true;
    }
    return false;
  },
}));
