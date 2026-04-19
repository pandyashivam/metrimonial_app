import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useOnboarding } from '../../src/onboarding-store';

export default function Family() {
  const router = useRouter();
  const s = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function next() {
    setErr(null);
    setSaving(true);
    try {
      await api.me.updateFamily({
        fatherName: s.fatherName,
        fatherOccupation: s.fatherOccupation || null,
        motherName: s.motherName,
        motherOccupation: s.motherOccupation || null,
        siblings: [],
        familyType: s.familyType,
        familyStatus: s.familyStatus,
        nativePlace: s.nativePlace || null,
      });
      router.push('/(onboarding)/horoscope');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Please fill all required fields');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.step}>Step 2 of 6</Text>
          <Text style={styles.title}>Family</Text>

          <Input label="Father's name" required value={s.fatherName} onChangeText={(t) => s.set({ fatherName: t })} />
          <Input label="Father's occupation" value={s.fatherOccupation} onChangeText={(t) => s.set({ fatherOccupation: t })} />
          <Input label="Mother's name" required value={s.motherName} onChangeText={(t) => s.set({ motherName: t })} />
          <Input label="Mother's occupation" value={s.motherOccupation} onChangeText={(t) => s.set({ motherOccupation: t })} />
          <Input label="Family type" placeholder="Nuclear / Joint" value={s.familyType} onChangeText={(t) => s.set({ familyType: t as 'Nuclear' | 'Joint' })} />
          <Input label="Family status" value={s.familyStatus} onChangeText={(t) => s.set({ familyStatus: t })} hint="e.g. Middle Class, Upper Middle Class" />
          <Input label="Native place" value={s.nativePlace} onChangeText={(t) => s.set({ nativePlace: t })} />

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
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: spacing.lg },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
