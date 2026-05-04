import { Banner, Button, Input, PageFrame, ScreenHeader } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { api } from '../../src/api';
import { KeyboardSafe } from '../../src/KeyboardSafe';
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
      setErr(e instanceof Error ? e.message : 'Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardSafe>
      <PageFrame>
        <ScreenHeader
          kicker="Step 4 of 6"
          title="Partner preferences"
          subtitle="Broad preferences help us rank better matches. You can change these any time from your profile."
        />
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
          label="Preferred religions"
          hint="Comma-separated"
          value={s.prefReligions.join(', ')}
          onChangeText={(t) => s.set({ prefReligions: t.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
        <Input
          label="Preferred castes"
          hint="Optional, comma-separated"
          value={s.prefCastes.join(', ')}
          onChangeText={(t) => s.set({ prefCastes: t.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
        <Input
          label="Preferred cities"
          hint="Optional, comma-separated"
          value={s.prefCities.join(', ')}
          onChangeText={(t) => s.set({ prefCities: t.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
        {err ? <Banner>{err}</Banner> : null}
        <Button title="Continue" size="lg" onPress={next} loading={saving} block />
      </PageFrame>
    </KeyboardSafe>
  );
}
