import {
  Banner,
  Button,
  Card,
  Chip,
  PageFrame,
  ScreenHeader,
  Skeleton,
  VerificationBadge,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['profile', id], queryFn: () => api.profiles.get(id!) });

  // Log a view (idempotent per day, fire-and-forget).
  useEffect(() => {
    if (id) api.views.log(id).catch(() => null);
  }, [id]);

  const sendInterest = useMutation({
    mutationFn: () => api.interests.send(id!),
    onMutate: () => haptics.medium(),
    onSuccess: () => {
      haptics.success();
      qc.invalidateQueries({ queryKey: ['interests'] });
      qc.invalidateQueries({ queryKey: ['entitlements'] });
    },
    onError: () => haptics.error(),
  });
  const shortlist = useMutation({
    mutationFn: () => api.shortlist.add(id!),
    onMutate: () => haptics.light(),
    onSuccess: () => haptics.success(),
  });

  if (profile.isLoading) {
    return (
      <PageFrame>
        <View style={{ gap: spacing.md }}>
          <Skeleton height={36} width="70%" />
          <Skeleton height={20} width="40%" />
          <Skeleton height={140} rounded={16} />
          <Skeleton height={140} rounded={16} />
          <Skeleton height={140} rounded={16} />
        </View>
      </PageFrame>
    );
  }

  const p = profile.data;
  if (!p) {
    return (
      <PageFrame>
        <Banner variant="warn" title="Profile not found">
          This profile may have been removed or is no longer available.
        </Banner>
        <Button title="Go back" variant="outline" onPress={() => router.back()} block />
      </PageFrame>
    );
  }

  const tier = (p as unknown as { verification?: { tier: 'BASIC' | 'VERIFIED' | 'PREMIUM' } })
    .verification?.tier ?? 'BASIC';

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Profile"
        title={p.fullName}
        subtitle={p.city}
        size="md"
      />
      <View style={styles.tierRow}>
        <VerificationBadge tier={tier} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.h2}>About</Text>
        <Text style={styles.body}>{p.aboutMe}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Basics</Text>
        <View style={styles.chipRow}>
          <Chip label={p.religion} tone="primary" />
          <Chip label={p.caste} tone="accent" />
          <Chip label={p.motherTongue} />
          <Chip label={p.city} tone="info" />
          <Chip label={p.diet} tone="success" />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Career</Text>
        <Text style={styles.body}>{p.education}</Text>
        <Text style={styles.muted}>
          {p.occupation}
          {p.income ? ` · ${p.income}` : ''}
        </Text>
      </Card>

      <Button
        title="View kundli compatibility"
        variant="outline"
        size="lg"
        onPress={() => {
          haptics.light();
          router.push(`/kundli/${id}`);
        }}
        block
        style={{ marginTop: spacing.sm }}
      />

      <View style={styles.actions}>
        <Button
          title={sendInterest.isPending ? 'Sending…' : 'Send interest'}
          size="lg"
          onPress={() => sendInterest.mutate()}
          loading={sendInterest.isPending}
          block
        />
        <Button
          title="Shortlist"
          variant="outline"
          size="lg"
          onPress={() => shortlist.mutate()}
          loading={shortlist.isPending}
        />
      </View>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  tierRow: { marginBottom: spacing.lg, marginTop: -spacing.md },
  card: { marginBottom: spacing.md },
  h2: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: { color: colors.text, lineHeight: 22, fontSize: fontSizes.md },
  muted: { color: colors.textMuted, marginTop: 4, fontSize: fontSizes.sm },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
