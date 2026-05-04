import {
  Banner,
  Button,
  Card,
  Chip,
  PageFrame,
  ScreenHeader,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { api } from '../../src/api';
import { useAppLock } from '../../src/app-lock';
import { useAuth } from '../../src/auth-store';
import { useAppTheme, useThemeStore } from '../../src/theme';

type PrefKey =
  | 'newInterest'
  | 'interestAccepted'
  | 'newMessage'
  | 'profileViewed'
  | 'premiumMatch'
  | 'verificationApproved';

const PREF_LABELS: Record<PrefKey, string> = {
  newInterest: 'New interests',
  interestAccepted: 'Interest accepted',
  newMessage: 'New messages',
  profileViewed: 'Someone viewed my profile',
  premiumMatch: 'High-score AI matches',
  verificationApproved: 'Verification updates',
};

export default function Settings() {
  const router = useRouter();
  const qc = useQueryClient();
  const { signOut } = useAuth();
  const theme = useAppTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const appLockEnabled = useAppLock((s) => s.enabled);
  const setAppLockEnabled = useAppLock((s) => s.setEnabled);
  const [appLockErr, setAppLockErr] = useState<string | null>(null);

  const prefs = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.me.notificationPrefs(),
  });
  const setPref = useMutation({
    mutationFn: (patch: Partial<Record<PrefKey, boolean>>) => api.me.setNotificationPrefs(patch),
    onMutate: (patch) => {
      const prev = qc.getQueryData(['notification-prefs']);
      qc.setQueryData(['notification-prefs'], { ...(prev as object), ...patch });
      return { prev };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notification-prefs'], ctx.prev);
    },
  });

  const options: Array<{ key: 'system' | 'light' | 'dark'; label: string }> = [
    { key: 'system', label: 'System' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ];

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Account"
        title="Settings"
        subtitle="Appearance, security, notifications, and more."
      />

      <Card style={{ ...styles.card, backgroundColor: theme.surface, borderColor: theme.border }}>
        <Text style={[styles.h2, { color: theme.textMuted }]}>Appearance</Text>
        <Text style={[styles.body, { color: theme.text }]}>
          Choose how ShubhMilan looks. System follows your device setting.
        </Text>
        <View style={styles.chipRow}>
          {options.map((o) => (
            <Pressable key={o.key} onPress={() => setMode(o.key)} hitSlop={4}>
              <Chip label={o.label} tone={mode === o.key ? 'primary' : 'neutral'} />
            </Pressable>
          ))}
        </View>
      </Card>

      {Platform.OS !== 'web' && (
        <Card style={{ ...styles.card, backgroundColor: theme.surface, borderColor: theme.border }}>
          <Text style={[styles.h2, { color: theme.textMuted }]}>Security</Text>
          <View style={[styles.pref, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={[styles.prefTitle, { color: theme.ink }]}>
                Require Face ID / Touch ID
              </Text>
              <Text style={[styles.prefSub, { color: theme.textMuted }]}>
                Prompt to unlock when the app comes back to the foreground.
              </Text>
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={async (v) => {
                setAppLockErr(null);
                try {
                  await setAppLockEnabled(v);
                } catch (e) {
                  setAppLockErr(e instanceof Error ? e.message : 'Could not enable.');
                }
              }}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          {appLockErr ? <Banner style={{ marginTop: spacing.sm, marginBottom: 0 }}>{appLockErr}</Banner> : null}
        </Card>
      )}

      <Card style={{ ...styles.card, backgroundColor: theme.surface, borderColor: theme.border }}>
        <Text style={[styles.h2, { color: theme.textMuted }]}>Notifications</Text>
        <Text style={[styles.body, { color: theme.text }]}>
          Turn off categories you don&apos;t want pushed to this device.
        </Text>
        {(Object.keys(PREF_LABELS) as PrefKey[]).map((k, i, arr) => (
          <View
            key={k}
            style={[
              styles.pref,
              { borderBottomColor: i === arr.length - 1 ? 'transparent' : theme.border },
            ]}
          >
            <Text style={[styles.prefTitle, { color: theme.ink, flex: 1 }]}>{PREF_LABELS[k]}</Text>
            <Switch
              value={prefs.data?.[k] ?? true}
              onValueChange={(v) => setPref.mutate({ [k]: v } as Partial<Record<PrefKey, boolean>>)}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
        ))}
      </Card>

      <Card style={{ ...styles.card, backgroundColor: theme.surface, borderColor: theme.border }}>
        <Text style={[styles.h2, { color: theme.textMuted }]}>Account</Text>
        <Button title="Verification" variant="outline" size="lg" onPress={() => router.push('/verify')} block />
        <Button
          title="Premium & billing"
          variant="outline"
          size="lg"
          onPress={() => router.push('/premium')}
          block
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Button title="Sign out" variant="outline" size="lg" onPress={signOut} block style={{ marginTop: spacing.sm }} />
      <Text style={[styles.foot, { color: theme.textMuted }]}>Version 0.1.0 · Trusted matrimony</Text>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  h2: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: { fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', gap: 8 },
  pref: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  prefTitle: { fontSize: fontSizes.md, fontWeight: '600' },
  prefSub: { fontSize: fontSizes.xs, marginTop: 4, lineHeight: fontSizes.xs * 1.45 },
  foot: { textAlign: 'center', fontSize: fontSizes.xs, marginTop: spacing.xl },
});
