import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '../tokens.js';

export interface TrustDonutProps {
  score: number;
  size?: number;
  label?: string;
}

/** Minimal donut — approximates the circular chart from the prototype without SVG dependency. */
export function TrustDonut({ score, size = 72, label = 'Trust' }: TrustDonutProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const ringColor = clamped >= 80 ? colors.success : clamped >= 50 ? colors.accent : colors.textMuted;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: ringColor, borderWidth: Math.max(4, size * 0.08) },
        ]}
      />
      <View style={styles.inner}>
        <Text style={[styles.score, { color: ringColor }]}>{clamped}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderStyle: 'solid' },
  inner: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: fontSizes.lg, fontWeight: '800' },
  label: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: '600', marginTop: -2 },
});
