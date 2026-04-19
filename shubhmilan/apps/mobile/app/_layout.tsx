import { ToastProvider } from '@shubhmilan/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, hydrateTokens } from '../src/api';
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
  const isDark = useIsDark();

  useEffect(() => {
    (async () => {
      await hydrateTheme();
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
  }, [setUser, setHydrated, syncKeys, hydrateTheme]);

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
