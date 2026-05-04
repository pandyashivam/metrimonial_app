import React from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fonts, fontSizes, spacing } from '../tokens.js';

export interface ScreenHeaderProps {
  /** Small uppercase accent line above the title (e.g. "Step 2 of 6"). */
  kicker?: string;
  title: string;
  /** Muted helper line under the title. */
  subtitle?: string;
  /** Use Playfair serif for the title. Default true. */
  serif?: boolean;
  /** Larger display title (used on welcome / hero screens). */
  size?: 'md' | 'lg';
  style?: ViewStyle;
}

/**
 * Standard page heading: kicker → title → subtitle.
 *
 * Establishes a single visual rhythm for every screen. Pages that need a
 * custom hero should still use this for the title block and add their own
 * surrounding chrome.
 */
export function ScreenHeader({
  kicker,
  title,
  subtitle,
  serif = true,
  size = 'md',
  style,
}: ScreenHeaderProps) {
  const titleSize = size === 'lg' ? fontSizes.xxxl : fontSizes.xxl;
  return (
    <View style={[styles.wrap, style]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text
        style={[
          styles.title,
          { fontSize: titleSize, lineHeight: titleSize * 1.15 },
          serif ? styles.titleSerif : styles.titleSans,
        ]}
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: colors.ink,
    fontWeight: '700',
  },
  titleSerif: {
    fontFamily:
      Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
  },
  titleSans: {
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: 6,
  },
});
