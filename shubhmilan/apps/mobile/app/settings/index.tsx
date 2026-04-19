import { Button, Card, Chip, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/auth-store';
import { useAppTheme, useThemeStore } from '../../src/theme';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const theme = useAppTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

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
  foot: { textAlign: 'center', fontSize: fontSizes.xs + 1, marginTop: spacing.lg },
});
