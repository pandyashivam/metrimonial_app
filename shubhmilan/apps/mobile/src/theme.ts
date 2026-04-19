import { colors, darkColors } from '@shubhmilan/ui';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';

const STORAGE_KEY = 'shubhmilan.theme.preference';

type Mode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: Mode;
  setMode: (m: Mode) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode });
    SecureStore.setItemAsync(STORAGE_KEY, mode).catch(() => null);
  },
  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ mode: stored });
    }
  },
}));

/**
 * Returns the active token palette given the user's explicit preference + system setting.
 * Call in any screen: `const theme = useAppTheme();` then use `theme.bg`, `theme.ink`, etc.
 */
export function useAppTheme() {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const effective = mode === 'system' ? system ?? 'light' : mode;
  return effective === 'dark' ? darkColors : colors;
}

export function useIsDark() {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const effective = mode === 'system' ? system ?? 'light' : mode;
  return effective === 'dark';
}
