import { Card, Chip, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

const LABELS: Record<string, string> = {
  varna: 'Varna',
  vashya: 'Vashya',
  tara: 'Tara',
  yoni: 'Yoni',
  grahaMaitri: 'Graha Maitri',
  gana: 'Gana',
  bhakoot: 'Bhakoot',
  nadi: 'Nadi',
};

export default function Kundli() {
  const { otherId } = useLocalSearchParams<{ otherId: string }>();
  const q = useQuery({
    queryKey: ['kundli', otherId],
    queryFn: () => api.matches.kundli(otherId!),
    enabled: !!otherId,
  });

  if (q.isLoading) return <Text style={{ padding: spacing.xl }}>Calculating kundli…</Text>;
  const data = q.data;
  if (!data) return <Text style={{ padding: spacing.xl }}>Could not load kundli</Text>;

  const percent = Math.round((data.totalPoints / data.outOf) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={styles.h1}>Ashtakoot</Text>
          <Text style={styles.big}>
            {data.totalPoints} <Text style={styles.outOf}>/ 36</Text>
          </Text>
          <Text style={styles.sub}>{percent}% compatibility</Text>
          <Chip
            label={data.compatibility}
            tone={
              data.compatibility === 'Excellent'
                ? 'success'
                : data.compatibility === 'Good'
                  ? 'primary'
                  : data.compatibility === 'Average'
                    ? 'warn'
                    : 'danger'
            }
          />
        </Card>

        <Card>
          <Text style={styles.h2}>Breakdown</Text>
          {Object.entries(data.breakdown).map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.rowLabel}>{LABELS[k] ?? k}</Text>
              <Text style={styles.rowVal}>
                {v.points} / {v.max}
              </Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.h2}>Doshas</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Chip label={`Manglik ${data.doshas.manglik ? 'present' : 'none'}`} tone={data.doshas.manglik ? 'warn' : 'success'} />
            <Chip label={`Nadi ${data.doshas.nadiDosha ? 'present' : 'none'}`} tone={data.doshas.nadiDosha ? 'warn' : 'success'} />
            <Chip label={`Bhakoot ${data.doshas.bhakootDosha ? 'present' : 'none'}`} tone={data.doshas.bhakootDosha ? 'warn' : 'success'} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink },
  h2: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  big: { fontSize: 44, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  outOf: { fontSize: fontSizes.md, color: colors.textMuted },
  sub: { color: colors.textMuted, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border },
  rowLabel: { color: colors.text },
  rowVal: { color: colors.ink, fontWeight: '700' },
});
