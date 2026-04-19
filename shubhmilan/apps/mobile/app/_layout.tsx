import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, hydrateTokens } from '../src/api';
import { useAuth } from '../src/auth-store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [booted, setBooted] = useState(false);
  const { user, setUser, hydrated, setHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await hydrateTokens();
      try {
        const me = await api.me.get();
        setUser(me);
      } catch {
        setUser(null);
      }
      setHydrated(true);
      setBooted(true);
    })();
  }, [setUser, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/welcome');
    else if (user && inAuthGroup) router.replace('/(tabs)/home');
  }, [hydrated, user, segments, router]);

  if (!booted) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: 'Profile' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
