import { Button, Card, Chip, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';

/**
 * Discovery filters (stored in Zustand so Home can read them).
 */
interface FilterState {
  religion?: string;
  caste?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
  verified?: boolean;
  set: (patch: Partial<FilterState>) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>((set) => ({
  set: (patch) => set(patch),
  reset: () => set({ religion: undefined, caste: undefined, city: undefined, ageMin: undefined, ageMax: undefined, verified: undefined }),
}));

export default function Filters() {
  const router = useRouter();
  const f = useFilters();
  const [verifiedOnly, setVerifiedOnly] = useState(!!f.verified);

  function apply() {
    f.set({ verified: verifiedOnly });
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={styles.h1}>Find your match</Text>
          <Text style={styles.sub}>All filters are optional. Leave blank to match everyone.</Text>
        </Card>

        <Input label="Religion" value={f.religion ?? ''} onChangeText={(t) => f.set({ religion: t || undefined })} />
        <Input label="Caste" value={f.caste ?? ''} onChangeText={(t) => f.set({ caste: t || undefined })} />
        <Input label="City" value={f.city ?? ''} onChangeText={(t) => f.set({ city: t || undefined })} />
        <Input
          label="Age min"
          value={f.ageMin ? String(f.ageMin) : ''}
          onChangeText={(t) => f.set({ ageMin: t ? parseInt(t, 10) : undefined })}
          inputMode="numeric"
        />
        <Input
          label="Age max"
          value={f.ageMax ? String(f.ageMax) : ''}
          onChangeText={(t) => f.set({ ageMax: t ? parseInt(t, 10) : undefined })}
          inputMode="numeric"
        />

        <Card>
          <Text style={styles.h2}>Trust</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[false, true].map((v) => (
              <Chip
                key={String(v)}
                label={v ? 'Verified only' : 'All profiles'}
                tone={verifiedOnly === v ? 'primary' : 'neutral'}
                icon={
                  <Text style={{ color: verifiedOnly === v ? colors.primary : colors.text }}>•</Text>
                }
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button
              title={verifiedOnly ? 'Verified only ✓' : 'Verified only'}
              variant={verifiedOnly ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setVerifiedOnly((v) => !v)}
            />
          </View>
        </Card>

        <Button title="Apply filters" onPress={apply} block />
        <Button
          title="Reset"
          variant="ghost"
          onPress={() => {
            f.reset();
            setVerifiedOnly(false);
          }}
          block
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  h2: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  sub: { color: colors.textMuted, marginTop: 4 },
});
