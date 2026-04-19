import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useOnboarding } from '../../src/onboarding-store';

export default function Basics() {
  const router = useRouter();
  const s = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function next() {
    setErr(null);
    setSaving(true);
    try {
      await api.me.updateProfile({
        fullName: s.fullName,
        gender: (s.gender || 'Other') as 'Male' | 'Female' | 'Other',
        dob: s.dob,
        height: s.height,
        maritalStatus: s.maritalStatus as 'Never Married',
        motherTongue: s.motherTongue,
        religion: s.religion,
        caste: s.caste,
        subCaste: s.subCaste || null,
        gotra: s.gotra || null,
        manglik: s.manglik as 'No',
        education: s.education,
        occupation: s.occupation,
        income: s.income || null,
        city: s.city,
        state: s.state,
        country: s.country || 'India',
        diet: s.diet as 'Vegetarian',
        smoking: s.smoking,
        drinking: s.drinking,
        aboutMe: s.aboutMe,
        familyValues: s.familyValues,
        personalityTraits: s.personalityTraits,
        hobbies: s.hobbies,
        languages: s.languages,
      } as never);
      router.push('/(onboarding)/family');
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
          <Text style={styles.step}>Step 1 of 6</Text>
          <Text style={styles.title}>Basics</Text>

          <Input label="Full name" required value={s.fullName} onChangeText={(t) => s.set({ fullName: t })} />
          <Input label="Date of birth" required placeholder="YYYY-MM-DD" value={s.dob} onChangeText={(t) => s.set({ dob: t })} />
          <Input label="Gender" required placeholder="Male / Female / Other" value={s.gender} onChangeText={(t) => s.set({ gender: t as 'Male' | 'Female' | 'Other' | '' })} />
          <Input label="Height" required placeholder={"e.g. 5'6\""} value={s.height} onChangeText={(t) => s.set({ height: t })} />
          <Input label="Religion" required value={s.religion} onChangeText={(t) => s.set({ religion: t })} />
          <Input label="Caste" required value={s.caste} onChangeText={(t) => s.set({ caste: t })} />
          <Input label="Mother tongue" required value={s.motherTongue} onChangeText={(t) => s.set({ motherTongue: t })} />
          <Input label="Education" required value={s.education} onChangeText={(t) => s.set({ education: t })} />
          <Input label="Occupation" required value={s.occupation} onChangeText={(t) => s.set({ occupation: t })} />
          <Input label="City" required value={s.city} onChangeText={(t) => s.set({ city: t })} />
          <Input label="State" required value={s.state} onChangeText={(t) => s.set({ state: t })} />
          <Input
            label="About me"
            required
            multiline
            numberOfLines={5}
            value={s.aboutMe}
            onChangeText={(t) => s.set({ aboutMe: t })}
            hint="Min 40 characters. Our AI coach can polish this for you later."
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
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: spacing.lg },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
