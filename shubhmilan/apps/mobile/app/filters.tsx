import {
  Button,
  Card,
  Chip,
  Input,
  PageFrame,
  ScreenHeader,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KeyboardSafe } from '../src/KeyboardSafe';
import { useFilters } from '../src/filter-store';

type Gender = 'Male' | 'Female' | 'Other';
const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain Vegetarian', 'Vegan'] as const;
const MANGLIK = ['No', 'Yes', 'Anshik (Partial)', "Don't Know"] as const;

export default function Filters() {
  const router = useRouter();
  const f = useFilters();

  return (
    <KeyboardSafe>
      <PageFrame>
        <ScreenHeader
          kicker="Refine"
          title="Find your match"
          subtitle="Filters are optional. Some advanced filters require a Silver plan or higher."
        />

        <Card style={styles.card}>
          <Text style={styles.h2}>Gender</Text>
          <View style={styles.chipRow}>
            {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
              <ChipButton
                key={g}
                label={g}
                active={f.gender === g}
                onPress={() => f.set({ gender: f.gender === g ? undefined : g })}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Age range</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Min"
                value={f.ageMin ? String(f.ageMin) : ''}
                onChangeText={(t) => f.set({ ageMin: t ? parseInt(t, 10) : undefined })}
                inputMode="numeric"
                placeholder="18"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Max"
                value={f.ageMax ? String(f.ageMax) : ''}
                onChangeText={(t) => f.set({ ageMax: t ? parseInt(t, 10) : undefined })}
                inputMode="numeric"
                placeholder="35"
              />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Location</Text>
          <Input label="City" value={f.city ?? ''} onChangeText={(t) => f.set({ city: t || undefined })} autoComplete="address-line2" />
          <Input label="State" value={f.state ?? ''} onChangeText={(t) => f.set({ state: t || undefined })} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Background</Text>
          <Text style={styles.tierHint}>Silver and above</Text>
          <Input label="Religion" value={f.religion ?? ''} onChangeText={(t) => f.set({ religion: t || undefined })} />
          <Input label="Caste" value={f.caste ?? ''} onChangeText={(t) => f.set({ caste: t || undefined })} />
          <Input label="Mother tongue" value={f.motherTongue ?? ''} onChangeText={(t) => f.set({ motherTongue: t || undefined })} />
          <Input label="Education" value={f.education ?? ''} onChangeText={(t) => f.set({ education: t || undefined })} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Diet</Text>
          <Text style={styles.tierHint}>Silver and above</Text>
          <View style={styles.chipRow}>
            {DIETS.map((d) => (
              <ChipButton
                key={d}
                label={d}
                active={f.diet === d}
                onPress={() => f.set({ diet: f.diet === d ? undefined : d })}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Manglik</Text>
          <Text style={styles.tierHint}>Silver and above</Text>
          <View style={styles.chipRow}>
            {MANGLIK.map((m) => (
              <ChipButton
                key={m}
                label={m}
                active={f.manglik === m}
                onPress={() => f.set({ manglik: f.manglik === m ? undefined : m })}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h2}>Trust & availability</Text>
          <View style={styles.chipRow}>
            <ChipButton
              label="Verified only"
              active={!!f.verified}
              onPress={() => f.set({ verified: f.verified ? undefined : true })}
            />
            <ChipButton
              label="Online now"
              active={!!f.online}
              onPress={() => f.set({ online: f.online ? undefined : true })}
            />
          </View>
        </Card>

        <Button title="Apply filters" size="lg" onPress={() => router.back()} block />
        <Button title="Reset all" variant="ghost" size="lg" onPress={() => f.reset()} block style={{ marginTop: spacing.sm }} />
      </PageFrame>
    </KeyboardSafe>
  );
}

function ChipButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <Chip label={label} tone={active ? 'primary' : 'neutral'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  h2: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tierHint: {
    fontSize: fontSizes.xs,
    color: colors.accentDark,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
