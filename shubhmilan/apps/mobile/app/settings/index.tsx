import { Button, Card, Chip, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
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

  const prefs = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.me.notificationPrefs(),
  });
  const setPref = useMutation({
    mutationFn: (patch: Partial<Record<PrefKey, boolean>>) => api.me.setNotificationPrefs(patch),
    onMutate: (patch) => {
      const prev = qc.getQueryData(['notification-prefs']);
      qc.setQueryData(['notification-prefs'], {
        ...(prev as object),
        ...patch,
      });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[styles.h1, { color: theme.ink }]}>Settings</Text>

        <Card style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <Text style={[styles.h2, { color: theme.ink }]}>Appearance</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            Choose how ShubhMilan looks. System follows your device setting.
          </Text>
          <View style={styles.row}>
            {options.map((o) => (
              <Pressable key={o.key} onPress={() => setMode(o.key)}>
                <Chip label={o.label} tone={mode === o.key ? 'primary' : 'neutral'} />
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <Text style={[styles.h2, { color: theme.ink }]}>Notifications</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>Turn off categories you don&apos;t want pushed to this device.</Text>
          {(Object.keys(PREF_LABELS) as PrefKey[]).map((k) => (
            <View key={k} style={styles.pref}>
              <Text style={{ color: theme.ink, flex: 1 }}>{PREF_LABELS[k]}</Text>
              <Switch
                value={prefs.data?.[k] ?? true}
                onValueChange={(v) => setPref.mutate({ [k]: v } as Partial<Record<PrefKey, boolean>>)}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
          ))}
        </Card>

        <Card style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <Text style={[styles.h2, { color: theme.ink }]}>Account</Text>
          <Button title="Verification" variant="outline" onPress={() => router.push('/verify')} block />
          <Button
            title="Premium & billing"
            variant="outline"
            onPress={() => router.push('/premium')}
            block
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        <Button title="Sign out" variant="outline" onPress={signOut} block />
        <Text style={[styles.foot, { color: theme.textMuted }]}>Version 0.1.0 · Trusted matrimony</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: fontSizes.xxl, fontWeight: '800' },
  h2: { fontSize: fontSizes.md, fontWeight: '700', marginBottom: 4 },
  sub: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: 8 },
  pref: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  foot: { textAlign: 'center', fontSize: fontSizes.xs + 1, marginTop: spacing.lg },
});
