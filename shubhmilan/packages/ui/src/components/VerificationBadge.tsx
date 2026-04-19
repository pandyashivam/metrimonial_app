import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, tierColors } from '../tokens.js';

export interface VerificationBadgeProps {
  tier: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  compact?: boolean;
}

const LABELS = {
  BASIC: 'Basic',
  VERIFIED: 'Verified',
  PREMIUM: 'Premium Trust',
};

export function VerificationBadge({ tier, compact }: VerificationBadgeProps) {
  const color = tierColors[tier];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {!compact && <Text style={[styles.label, { color }]}>{LABELS[tier]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: fontSizes.xs, fontWeight: '700' },
});
