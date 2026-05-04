import { Banner, Button, Input, PageFrame, ScreenHeader } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { api } from '../../src/api';
import { KeyboardSafe } from '../../src/KeyboardSafe';
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
    <KeyboardSafe>
      <PageFrame>
        <ScreenHeader
          kicker="Step 2 of 6"
          title="Your family"
          subtitle="Family context helps matchmakers and families find common ground."
        />
        <Input label="Father's name" required value={s.fatherName} onChangeText={(t) => s.set({ fatherName: t })} autoComplete="name" />
        <Input label="Father's occupation" value={s.fatherOccupation} onChangeText={(t) => s.set({ fatherOccupation: t })} />
        <Input label="Mother's name" required value={s.motherName} onChangeText={(t) => s.set({ motherName: t })} autoComplete="name" />
        <Input label="Mother's occupation" value={s.motherOccupation} onChangeText={(t) => s.set({ motherOccupation: t })} />
        <Input label="Family type" placeholder="Nuclear or Joint" value={s.familyType} onChangeText={(t) => s.set({ familyType: t as 'Nuclear' | 'Joint' })} />
        <Input label="Family status" placeholder="e.g. Middle Class" value={s.familyStatus} onChangeText={(t) => s.set({ familyStatus: t })} />
        <Input label="Native place" value={s.nativePlace} onChangeText={(t) => s.set({ nativePlace: t })} />
        {err ? <Banner>{err}</Banner> : null}
        <Button title="Continue" size="lg" onPress={next} loading={saving} block />
      </PageFrame>
    </KeyboardSafe>
  );
}
