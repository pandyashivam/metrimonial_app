import { colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
import { Platform, StyleSheet, Text, View } from 'react-native';

/**
 * Reusable wrapper for the long-form marketing routes (privacy, terms,
 * how-it-works, etc.). Keeps every page on the same column width, kicker, and
 * Playfair display title rhythm without each page hand-rolling the chrome.
 */
export function MarketingPage({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.frame}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

const SERIF = Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display;

const styles = StyleSheet.create({
  page: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  frame: { width: '100%', maxWidth: 740, alignSelf: 'center' },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: SERIF,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },
  intro: {
    color: colors.textMuted,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    marginTop: spacing.md,
  },
  body: { marginTop: spacing.xl, gap: spacing.lg },
});

export const proseStyles = StyleSheet.create({
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: SERIF,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  p: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.7 },
  list: { gap: 6 },
  li: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.6 },
});
