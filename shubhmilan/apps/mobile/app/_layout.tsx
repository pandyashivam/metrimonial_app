import { ToastProvider } from '@shubhmilan/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, hydrateTokens } from '../src/api';
import { useAppLock } from '../src/app-lock';
import { LockScreen } from '../src/LockScreen';
import { useAuth } from '../src/auth-store';
import { attachDeepLinks } from '../src/deep-links';
import { useIsDark, useThemeStore } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [booted, setBooted] = useState(false);
  const { user, setUser, hydrated, setHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const syncKeys = useAuth((s) => s.syncEncryptionKeys);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLock = useAppLock((s) => s.hydrate);
  const lockNow = useAppLock((s) => s.lock);
  const locked = useAppLock((s) => s.locked);
  const isDark = useIsDark();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      await hydrateTheme();
      await hydrateLock();
      await hydrateTokens();
      try {
        const me = await api.me.get();
        setUser(me);
        // Ensure E2E encryption keys exist for this device and the server has our public key.
        await syncKeys();
      } catch {
        setUser(null);
      }
      setHydrated(true);
      setBooted(true);
    })();
  }, [setUser, setHydrated, syncKeys, hydrateTheme, hydrateLock]);

  // Lock the app when it goes to the background so a re-open requires biometric unlock.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (
        appState.current.match(/active/) &&
        (next === 'background' || next === 'inactive')
      ) {
        lockNow();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [lockNow]);

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/welcome');
    else if (user && inAuthGroup) router.replace('/(tabs)/home');
  }, [hydrated, user, segments, router]);

  useEffect(() => {
    if (!hydrated) return;
    let detach: (() => void) | null = null;
    attachDeepLinks(router, () => !!useAuth.getState().user).then((d) => (detach = d));
    return () => detach?.();
  }, [hydrated, router]);

  if (!booted) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {locked && user ? <LockScreen /> : null}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: 'Profile' }} />
          <Stack.Screen
            name="chat/[conversationId]"
            options={{ headerShown: true, title: 'Chat' }}
          />
          <Stack.Screen name="kundli/[otherId]" options={{ headerShown: true, title: 'Kundli' }} />
          <Stack.Screen name="verify/index" options={{ headerShown: true, title: 'Verification' }} />
          <Stack.Screen name="verify/video" options={{ headerShown: true, title: 'Video KYC' }} />
          <Stack.Screen name="verify/background" options={{ headerShown: true, title: 'Background check' }} />
          <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'Settings' }} />
          <Stack.Screen name="premium" options={{ headerShown: true, title: 'Go Premium' }} />
          <Stack.Screen name="filters" options={{ headerShown: true, title: 'Filters' }} />
          <Stack.Screen name="(onboarding)" />
        </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
