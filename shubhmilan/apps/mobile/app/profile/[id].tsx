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
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
  privacy: 'PUBLIC' | 'MEMBERS' | 'REQUEST';
}

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
          <Skeleton height={320} rounded={16} />
          <Skeleton height={120} rounded={16} />
          <Skeleton height={120} rounded={16} />
        </View>
      </PageFrame>
    );
  }

  const p = profile.data as
    | (Record<string, unknown> & {
        fullName: string;
        city: string;
        state?: string;
        aboutMe: string;
        religion: string;
        caste: string;
        motherTongue: string;
        diet: string;
        education: string;
        occupation: string;
        income?: string | null;
        height?: string;
        maritalStatus?: string;
        hobbies?: string[];
        languages?: string[];
        personalityTraits?: string[];
        photos?: Photo[];
        verification?: { tier: 'BASIC' | 'VERIFIED' | 'PREMIUM' } | null;
        family?: {
          fatherName?: string;
          fatherOccupation?: string | null;
          motherName?: string;
          motherOccupation?: string | null;
          familyType?: string;
          familyStatus?: string;
          nativePlace?: string | null;
        } | null;
        horoscope?: {
          birthTime?: string;
          birthPlace?: string;
          rashi?: string | null;
          nakshatra?: string | null;
          doshas?: { manglik?: boolean; nadiDosha?: boolean; bhakootDosha?: boolean };
        } | null;
      })
    | undefined;
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

  const tier = p.verification?.tier ?? 'BASIC';
  const photos = (p.photos ?? []) as Photo[];

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Profile"
        title={p.fullName}
        subtitle={[p.city, p.state].filter(Boolean).join(', ')}
        size="md"
      />
      <View style={styles.tierRow}>
        <VerificationBadge tier={tier} />
      </View>

      {photos.length > 0 ? <PhotoGallery photos={photos} /> : null}

      <Card style={styles.card}>
        <Text style={styles.h2}>About</Text>
        <Text style={styles.body}>{p.aboutMe}</Text>
        {p.hobbies && p.hobbies.length > 0 ? (
          <View style={[styles.chipRow, { marginTop: spacing.md }]}>
            {p.hobbies.map((h) => (
              <Chip key={h} label={h} tone="neutral" />
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Basics</Text>
        <Facts
          rows={[
            ['Religion', p.religion],
            ['Caste', p.caste],
            ['Mother tongue', p.motherTongue],
            ['Diet', p.diet],
            p.height ? ['Height', p.height] : null,
            p.maritalStatus ? ['Marital status', p.maritalStatus] : null,
          ].filter(Boolean) as Array<[string, string]>}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Career</Text>
        <Facts
          rows={[
            ['Education', p.education],
            ['Profession', p.occupation],
            p.income ? ['Income', p.income] : null,
          ].filter(Boolean) as Array<[string, string]>}
        />
      </Card>

      {p.family ? (
        <Card style={styles.card}>
          <Text style={styles.h2}>Family</Text>
          <Facts
            rows={[
              p.family.fatherName ? ['Father', `${p.family.fatherName}${p.family.fatherOccupation ? ` · ${p.family.fatherOccupation}` : ''}`] : null,
              p.family.motherName ? ['Mother', `${p.family.motherName}${p.family.motherOccupation ? ` · ${p.family.motherOccupation}` : ''}`] : null,
              p.family.familyType ? ['Family type', p.family.familyType] : null,
              p.family.familyStatus ? ['Family status', p.family.familyStatus] : null,
              p.family.nativePlace ? ['Native place', p.family.nativePlace] : null,
            ].filter(Boolean) as Array<[string, string]>}
          />
        </Card>
      ) : null}

      {p.horoscope ? (
        <Card style={styles.card}>
          <Text style={styles.h2}>Horoscope</Text>
          <Facts
            rows={[
              p.horoscope.birthTime ? ['Birth time', p.horoscope.birthTime] : null,
              p.horoscope.birthPlace ? ['Birth place', p.horoscope.birthPlace] : null,
              p.horoscope.rashi ? ['Rashi', p.horoscope.rashi] : null,
              p.horoscope.nakshatra ? ['Nakshatra', p.horoscope.nakshatra] : null,
              p.horoscope.doshas?.manglik !== undefined
                ? ['Manglik', p.horoscope.doshas.manglik ? 'Yes' : 'No']
                : null,
            ].filter(Boolean) as Array<[string, string]>}
          />
        </Card>
      ) : null}

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

function Facts({ rows }: { rows: Array<[string, string]> }) {
  return (
    <View>
      {rows.map(([label, value], i) => (
        <View
          key={label}
          style={[
            styles.factRow,
            i === rows.length - 1 ? { borderBottomWidth: 0 } : null,
          ]}
        >
          <Text style={styles.factLabel}>{label}</Text>
          <Text style={styles.factValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, photos.length - 1);
  const main = photos[safeActive];
  if (!main) return null;
  return (
    <Card style={[styles.card, { padding: 0 }]}>
      <View style={styles.heroPhotoWrap}>
        <Image
          source={{ uri: main.url }}
          style={styles.heroPhoto}
          accessibilityLabel="Profile photo"
        />
        {main.privacy !== 'PUBLIC' ? (
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyBadgeText}>{main.privacy === 'MEMBERS' ? 'Members only' : 'On request'}</Text>
          </View>
        ) : null}
      </View>
      {photos.length > 1 ? (
        <View style={styles.thumbStrip}>
          {photos.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => setActive(i)}
              style={({ pressed }) => [
                styles.thumb,
                i === safeActive ? styles.thumbActive : null,
                pressed ? { opacity: 0.85 } : null,
              ]}
              accessibilityLabel={`Photo ${i + 1}`}
            >
              <Image source={{ uri: p.url }} style={styles.thumbImage} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
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
  factRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: spacing.md,
  },
  factLabel: {
    width: 120,
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  factValue: { flex: 1, color: colors.ink, fontSize: fontSizes.md },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  heroPhotoWrap: { position: 'relative' },
  heroPhoto: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  privacyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(26,23,24,0.7)',
    borderRadius: 999,
  },
  privacyBadgeText: { color: '#FFFFFF', fontSize: fontSizes.xs, fontWeight: '600', letterSpacing: 0.3 },
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.sm,
    flexWrap: 'wrap',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ transition: 'border-color 150ms ease' } as never) : {}),
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: '100%', height: '100%', backgroundColor: colors.surfaceMuted },
});

