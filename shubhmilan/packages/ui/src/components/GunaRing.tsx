import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii } from '../tokens.js';

export interface GunaRingProps {
  totalPoints: number;
  /** Out-of — always 36 for Ashtakoot; kept as a prop for clarity. */
  outOf?: 36;
  size?: number;
}

/**
 * Circular kundli-score indicator. The prototype's `guna-ring` uses a conic-gradient
 * donut showing filled / unfilled portions of 36. react-native-web doesn't yet support
 * conic-gradient, so we approximate with nested circles and a label — visually similar
 * on mobile, still informative on web.
 */
export function GunaRing({ totalPoints, outOf = 36, size = 120 }: GunaRingProps) {
  const clamped = Math.max(0, Math.min(outOf, totalPoints));
  const pct = clamped / outOf;
  const tone = pct >= 0.75 ? colors.success : pct >= 0.5 ? colors.accent : colors.danger;
  const label = pct >= 0.75 ? 'Excellent' : pct >= 0.5 ? 'Good' : pct >= 0.33 ? 'Average' : 'Not recommended';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.outerRing,
          { width: size, height: size, borderRadius: size / 2, borderColor: tone, borderWidth: Math.max(6, size * 0.08) },
        ]}
      />
      <View style={[styles.innerRing, { width: size * 0.72, height: size * 0.72, borderRadius: (size * 0.72) / 2 }]}>
        <Text style={[styles.num, { color: tone }]}>{clamped}</Text>
        <Text style={styles.outOf}>/ {outOf}</Text>
      </View>
      <Text style={[styles.label, { color: tone }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute' },
  innerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.xl,
  },
  num: { fontSize: fontSizes.xxxl - 4, fontWeight: '800' },
  outOf: { fontSize: fontSizes.xs + 1, color: colors.textMuted, fontWeight: '600' },
  label: {
    position: 'absolute',
    bottom: -22,
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
