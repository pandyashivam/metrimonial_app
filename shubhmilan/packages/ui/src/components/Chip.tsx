import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

export interface ChipProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'accent';
  icon?: React.ReactNode;
}

export function Chip({ label, tone = 'neutral', icon }: ChipProps) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon}
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const tones = {
  neutral: { bg: '#f2f2f5', border: '#e6e6ec', text: colors.text },
  primary: { bg: colors.primary50, border: colors.primary100, text: colors.primary },
  success: { bg: colors.success50, border: '#c2e5d4', text: colors.success },
  warn: { bg: colors.warn50, border: '#f3e4c0', text: colors.warn },
  danger: { bg: colors.danger50, border: '#f4c8c2', text: colors.danger },
  info: { bg: colors.info50, border: '#c2d5eb', text: colors.info },
  accent: { bg: '#fdf6e7', border: '#f0e2be', text: colors.accentDark },
} as const;

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontSize: fontSizes.xs + 1, fontWeight: '600' },
});
