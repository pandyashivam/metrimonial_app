import {
  Banner,
  Card,
  Chip,
  PageFrame,
  ScreenHeader,
  Skeleton,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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

  if (q.isLoading) {
    return (
      <PageFrame>
        <ScreenHeader
          kicker="Compatibility"
          title="Calculating your Ashtakoot"
          subtitle="Crunching the eight kootas. Just a moment."
        />
        <Card style={{ marginBottom: spacing.md }}>
          <Skeleton height={28} width="40%" />
          <Skeleton height={48} width="60%" style={{ marginTop: 12 }} />
          <Skeleton height={20} width="50%" style={{ marginTop: 8 }} />
        </Card>
        <Card>
          <Skeleton height={20} width="40%" />
          <Skeleton height={16} style={{ marginTop: 12 }} />
          <Skeleton height={16} style={{ marginTop: 8 }} />
          <Skeleton height={16} style={{ marginTop: 8 }} />
        </Card>
      </PageFrame>
    );
  }

  const data = q.data;
  if (!data) {
    return (
      <PageFrame>
        <Banner variant="warn" title="Could not load kundli">
          We don&apos;t have enough horoscope data on one or both profiles. Add birth time and place
          to see compatibility.
        </Banner>
      </PageFrame>
    );
  }

  const percent = Math.round((data.totalPoints / data.outOf) * 100);

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Ashtakoot — Guna Milan"
        title="Kundli compatibility"
        subtitle="The eight koota method scores compatibility out of 36 points across heritage, temperament, and family."
      />

      <Card style={[styles.card, styles.heroCard]}>
        <Text style={styles.bigNumber}>
          {data.totalPoints} <Text style={styles.outOf}>/ 36</Text>
        </Text>
        <Text style={styles.percent}>{percent}% compatibility</Text>
        <View style={{ marginTop: 6 }}>
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
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Breakdown</Text>
        {Object.entries(data.breakdown).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.rowLabel}>{LABELS[k] ?? k}</Text>
            <Text style={styles.rowVal}>
              {v.points} <Text style={styles.outOfSmall}>/ {v.max}</Text>
            </Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Doshas</Text>
        <View style={styles.chipRow}>
          <Chip
            label={`Manglik ${data.doshas.manglik ? 'present' : 'none'}`}
            tone={data.doshas.manglik ? 'warn' : 'success'}
          />
          <Chip
            label={`Nadi ${data.doshas.nadiDosha ? 'present' : 'none'}`}
            tone={data.doshas.nadiDosha ? 'warn' : 'success'}
          />
          <Chip
            label={`Bhakoot ${data.doshas.bhakootDosha ? 'present' : 'none'}`}
            tone={data.doshas.bhakootDosha ? 'warn' : 'success'}
          />
        </View>
      </Card>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  heroCard: { alignItems: 'flex-start' },
  bigNumber: { fontSize: 56, fontWeight: '800', color: colors.primary, lineHeight: 60 },
  outOf: { fontSize: fontSizes.lg, color: colors.textMuted, fontWeight: '500' },
  outOfSmall: { color: colors.textMuted, fontWeight: '500' },
  percent: { color: colors.textMuted, fontSize: fontSizes.md, marginTop: 4 },
  h2: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  rowLabel: { color: colors.text, fontSize: fontSizes.md },
  rowVal: { color: colors.ink, fontWeight: '700', fontSize: fontSizes.md },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
