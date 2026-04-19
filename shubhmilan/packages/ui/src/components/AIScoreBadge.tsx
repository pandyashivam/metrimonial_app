import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii } from '../tokens.js';

export interface AIScoreBadgeProps {
  score: number;
}

export function AIScoreBadge({ score }: AIScoreBadgeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const label = clamped >= 85 ? 'Excellent Match' : clamped >= 70 ? 'Great Match' : clamped >= 55 ? 'Good Match' : 'Potential Match';
  return (
    <View style={styles.wrap}>
      <View style={styles.scoreChip}>
        <Text style={styles.scoreNum}>{clamped}</Text>
        <Text style={styles.scoreUnit}>%</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  scoreNum: { color: '#fff', fontWeight: '800', fontSize: fontSizes.md },
  scoreUnit: { color: '#fff', fontWeight: '700', fontSize: fontSizes.xs + 1, marginBottom: 2 },
  label: { color: colors.primary, fontWeight: '700', fontSize: fontSizes.sm },
});
