import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

export interface BannerProps {
  children: React.ReactNode;
  variant?: 'error' | 'success' | 'info' | 'warn';
  title?: string;
  style?: ViewStyle;
}

/**
 * Inline banner for server / submit results — always shown above the action,
 * never below it. Used in place of `Alert.alert()` so the message lives inside
 * the page instead of yanking native UI.
 */
export function Banner({ children, variant = 'error', title, style }: BannerProps) {
  const v = VARIANTS[variant];
  return (
    <View
      style={[styles.wrap, { backgroundColor: v.bg, borderColor: v.border }, style]}
      accessibilityLiveRegion="polite"
      accessibilityRole={variant === 'error' ? 'alert' : 'text'}
    >
      {title ? <Text style={[styles.title, { color: v.fg }]}>{title}</Text> : null}
      <Text style={[styles.body, { color: v.fg }]}>{children}</Text>
    </View>
  );
}

const VARIANTS = {
  error: { bg: colors.danger50, border: colors.danger, fg: colors.danger },
  success: { bg: colors.success50, border: colors.success, fg: colors.success },
  info: { bg: colors.info50, border: colors.info, fg: colors.info },
  warn: { bg: colors.warn50, border: colors.warn, fg: colors.warn },
} as const;

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSizes.sm, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: fontSizes.sm, fontWeight: '500', lineHeight: fontSizes.sm * 1.4 },
});
