import { Banner, Button, Input, PageFrame, ScreenHeader, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { api } from '../../src/api';
import { KeyboardSafe } from '../../src/KeyboardSafe';
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
      setErr(e instanceof Error ? e.message : 'Could not save. Try again or skip for now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardSafe>
      <PageFrame>
        <ScreenHeader
          kicker="Step 3 of 6"
          title="Horoscope"
          subtitle="Used for Ashtakoot (Guna Milan) compatibility. Optional — you can fill these later from your profile."
        />
        <Input label="Birth time" placeholder="HH:MM (24-hour)" value={s.birthTime} onChangeText={(t) => s.set({ birthTime: t })} inputMode="numeric" />
        <Input label="Birth place" value={s.birthPlace} onChangeText={(t) => s.set({ birthPlace: t })} />
        <Input label="Rashi (moon sign)" value={s.rashi} onChangeText={(t) => s.set({ rashi: t })} />
        <Input label="Nakshatra" value={s.nakshatra} onChangeText={(t) => s.set({ nakshatra: t })} />
        {err ? <Banner>{err}</Banner> : null}
        <Button title="Continue" size="lg" onPress={next} loading={saving} block />
        <Button
          title="Skip for now"
          variant="ghost"
          size="lg"
          onPress={() => router.push('/(onboarding)/preference')}
          block
          style={{ marginTop: spacing.sm }}
        />
      </PageFrame>
    </KeyboardSafe>
  );
}
