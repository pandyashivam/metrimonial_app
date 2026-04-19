import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useOnboarding } from '../../src/onboarding-store';

export default function Preference() {
  const router = useRouter();
  const s = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function next() {
    setErr(null);
    setSaving(true);
    try {
      await api.me.updatePreference({
        ageMin: s.ageMin,
        ageMax: s.ageMax,
        religions: s.prefReligions,
        castes: s.prefCastes,
        cities: s.prefCities,
        motherTongues: [],
        education: [],
        occupation: [],
        diet: [],
      } as never);
      router.push('/(onboarding)/photos');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Check your inputs');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.step}>Step 4 of 6</Text>
          <Text style={styles.title}>Partner preferences</Text>
          <Text style={styles.sub}>Broad preferences help us rank better matches. You can change these anytime.</Text>

          <Input
            label="Minimum age"
            value={String(s.ageMin)}
            onChangeText={(t) => s.set({ ageMin: parseInt(t, 10) || 18 })}
            inputMode="numeric"
          />
          <Input
            label="Maximum age"
            value={String(s.ageMax)}
            onChangeText={(t) => s.set({ ageMax: parseInt(t, 10) || 40 })}
            inputMode="numeric"
          />
          <Input
            label="Preferred religions (comma-separated)"
            value={s.prefReligions.join(', ')}
            onChangeText={(t) => s.set({ prefReligions: t.split(',').map((x) => x.trim()).filter(Boolean) })}
          />
          <Input
            label="Preferred castes (comma-separated, optional)"
            value={s.prefCastes.join(', ')}
            onChangeText={(t) => s.set({ prefCastes: t.split(',').map((x) => x.trim()).filter(Boolean) })}
          />
          <Input
            label="Preferred cities (comma-separated, optional)"
            value={s.prefCities.join(', ')}
            onChangeText={(t) => s.set({ prefCities: t.split(',').map((x) => x.trim()).filter(Boolean) })}
          />

          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Button title="Continue" onPress={next} loading={saving} block />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  step: { color: colors.primary, fontWeight: '700', letterSpacing: 1, fontSize: fontSizes.xs + 1, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4 },
  sub: { color: colors.textMuted, marginBottom: spacing.lg, marginTop: 6 },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
