import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileSummary } from '@shubhmilan/types';
import { colors, fontSizes, radii, shadows, spacing } from '../tokens.js';
import { VerificationBadge } from './VerificationBadge.js';

export interface ProfileCardProps {
  profile: ProfileSummary;
  onPress?: (id: string) => void;
  onInterest?: (id: string) => void;
  onShortlist?: (id: string) => void;
}

export function ProfileCard({ profile, onPress }: ProfileCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${profile.fullName}, ${profile.age}, ${profile.city}`}
      onPress={() => onPress?.(profile.id)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
    >
      <View style={styles.photoWrap}>
        {profile.primaryPhotoUrl ? (
          <Image source={{ uri: profile.primaryPhotoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoInitial}>{profile.fullName.charAt(0)}</Text>
          </View>
        )}
        {profile.isOnline && (
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
        <View style={styles.verifiedPill}>
          <VerificationBadge tier={profile.verificationTier} compact />
        </View>
      </View>
      <View style={{ padding: spacing.md }}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.fullName}, {profile.age}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {profile.height} · {profile.religion} · {profile.caste}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {profile.education} · {profile.city}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
    overflow: 'hidden',
  },
  photoWrap: { position: 'relative', aspectRatio: 3 / 4, backgroundColor: colors.primary100 },
  photo: { width: '100%', height: '100%' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 56, color: colors.primary, fontWeight: '800' },
  onlinePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  onlineText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.success },
  verifiedPill: { position: 'absolute', top: 10, right: 10 },
  name: { fontSize: fontSizes.md + 1, fontWeight: '700', color: colors.ink, marginBottom: 3 },
  meta: { fontSize: fontSizes.xs + 1, color: colors.textMuted, marginTop: 2 },
});
