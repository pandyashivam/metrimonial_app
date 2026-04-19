import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useOnboarding } from '../../src/onboarding-store';

export default function Horoscope() {
  const router = useRouter();
  const s = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function next() {
    setErr(null);
    setSaving(true);
    try {
      await api.me.updateHoroscope({
        birthTime: s.birthTime,
        birthPlace: s.birthPlace,
        doshas: { manglik: s.manglik === 'Yes', nadiDosha: false, bhakootDosha: false },
      });
      router.push('/(onboarding)/preference');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Skip or fill with known values');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.step}>Step 3 of 6</Text>
          <Text style={styles.title}>Horoscope</Text>
          <Text style={styles.sub}>
            Needed for Ashtakoot (Guna Milan) kundli matching. Optional — you can skip and fill later.
          </Text>

          <Input label="Birth time" placeholder="HH:MM (24-hour)" value={s.birthTime} onChangeText={(t) => s.set({ birthTime: t })} />
          <Input label="Birth place" value={s.birthPlace} onChangeText={(t) => s.set({ birthPlace: t })} />
          <Input label="Rashi (moon sign)" value={s.rashi} onChangeText={(t) => s.set({ rashi: t })} />
          <Input label="Nakshatra" value={s.nakshatra} onChangeText={(t) => s.set({ nakshatra: t })} />

          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Button title="Continue" onPress={next} loading={saving} block />
          <Button
            title="Skip for now"
            variant="ghost"
            onPress={() => router.push('/(onboarding)/preference')}
            block
            style={{ marginTop: spacing.sm }}
          />
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
