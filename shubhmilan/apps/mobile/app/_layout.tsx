import { ToastProvider } from '@shubhmilan/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, hydrateTokens } from '../src/api';
import { useAppLock } from '../src/app-lock';
import { LockScreen } from '../src/LockScreen';
import { useAuth } from '../src/auth-store';
import { attachDeepLinks } from '../src/deep-links';
import { useIsDark, useThemeStore } from '../src/theme';
import { loadWebFonts } from '../src/web-fonts';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [booted, setBooted] = useState(false);
  // Selectors so this layout only re-renders on changes to fields it actually
  // reads. A full `useAuth()` destructure would subscribe to the whole store
  // and cause the Stack to re-render (and child screens to potentially remount
  // and steal focus from inputs) whenever any store field changes.
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);
  const locked = useAppLock((s) => s.locked);
  const isDark = useIsDark();

  const segments = useSegments();
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Run once. We touch stores via getState() rather than as effect deps so
    // re-renders never re-trigger this bootstrap.
    let cancelled = false;
    loadWebFonts();
    (async () => {
      await useThemeStore.getState().hydrate();
      await useAppLock.getState().hydrate();
      await hydrateTokens();
      try {
        const me = await api.me.get();
        if (cancelled) return;
        useAuth.getState().setUser(me);
        await useAuth.getState().syncEncryptionKeys();
      } catch {
        if (cancelled) return;
        useAuth.getState().setUser(null);
      }
      if (cancelled) return;
      useAuth.getState().setHydrated(true);
      setBooted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock the app when it goes to the background so a re-open requires biometric unlock.
  // Web has no real backgrounding (just tab visibility) and no biometric hardware,
  // so we skip registering the listener entirely there — `useAppLock.enabled` is
  // already false on web, but skipping the listener saves a useless subscription.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (next) => {
      if (
        appState.current.match(/active/) &&
        (next === 'background' || next === 'inactive')
      ) {
        useAppLock.getState().lock();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Wait for the Stack to mount before navigating; otherwise expo-router
    // throws "Attempted to navigate before mounting the Root Layout".
    if (!booted || !hydrated) return;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inPublicGroup = group === '(public)';

    // Web: unauthenticated visitors are allowed to browse the marketing surface
    // (the (public) group) and the auth group. Anywhere else, send them to the
    // landing page so they can see what ShubhMilan is before signing up.
    // Native: there is no marketing surface — users see (auth)/welcome cold,
    // matching every other native app's first-run experience.
    if (!user) {
      if (Platform.OS === 'web') {
        if (!inAuthGroup && !inPublicGroup) router.replace('/');
      } else {
        if (!inAuthGroup) router.replace('/(auth)/welcome');
      }
      return;
    }
    // Authenticated users always go to the tabbed app, even if they land on a
    // public marketing URL by accident.
    if (inAuthGroup || inPublicGroup) router.replace('/(tabs)/home');
  }, [booted, hydrated, user, segments, router]);

  useEffect(() => {
    if (!booted || !hydrated) return;
    let detach: (() => void) | null = null;
    attachDeepLinks(router, () => !!useAuth.getState().user).then((d) => (detach = d));
    return () => detach?.();
  }, [booted, hydrated, router]);

  if (!booted) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {locked && user ? <LockScreen /> : null}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(public)" />
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
