import { Button, Card, Chip, VerificationBadge, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['profile', id], queryFn: () => api.profiles.get(id!) });
  const sendInterest = useMutation({
    mutationFn: () => api.interests.send(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interests'] }),
  });
  const shortlist = useMutation({ mutationFn: () => api.shortlist.add(id!) });

  if (profile.isLoading) return <Text style={{ padding: spacing.xl }}>Loading…</Text>;
  const p = profile.data;
  if (!p) return <Text style={{ padding: spacing.xl }}>Profile not found</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.name}>{p.fullName}</Text>
        <VerificationBadge tier={(p as unknown as { verification?: { tier: 'BASIC' | 'VERIFIED' | 'PREMIUM' } }).verification?.tier ?? 'BASIC'} />

        <Card>
          <Text style={styles.h2}>About</Text>
          <Text style={styles.body}>{p.aboutMe}</Text>
        </Card>

        <Card>
          <Text style={styles.h2}>Basics</Text>
          <View style={styles.chipRow}>
            <Chip label={p.religion} tone="primary" />
            <Chip label={p.caste} tone="accent" />
            <Chip label={p.motherTongue} />
            <Chip label={p.city} tone="info" />
            <Chip label={p.diet} tone="success" />
          </View>
        </Card>

        <Card>
          <Text style={styles.h2}>Career</Text>
          <Text style={styles.body}>{p.education}</Text>
          <Text style={styles.muted}>{p.occupation}{p.income ? ` · ${p.income}` : ''}</Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            title={sendInterest.isPending ? 'Sending…' : 'Send interest'}
            onPress={() => sendInterest.mutate()}
            loading={sendInterest.isPending}
            block
          />
          <Button
            title="Shortlist"
            variant="outline"
            onPress={() => shortlist.mutate()}
            loading={shortlist.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 26, fontWeight: '800', color: colors.ink },
  h2: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  body: { color: colors.text, lineHeight: 22 },
  muted: { color: colors.textMuted, marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
});
