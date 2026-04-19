import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii } from '../tokens.js';

export interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, color = '#fff', bg = colors.primary }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: radii.pill, alignSelf: 'flex-start' },
  text: { fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 0.2 },
});
