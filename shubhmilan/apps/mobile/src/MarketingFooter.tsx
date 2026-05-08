import { colors, fontSizes, spacing } from '@shubhmilan/ui';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const COL_LINKS: Array<{
  heading: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    heading: 'Product',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/success-stories', label: 'Success stories' },
      { href: '/safety', label: 'Safety' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About ShubhMilan' },
      { href: '/(auth)/signup', label: 'Get started' },
      { href: '/(auth)/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.frame}>
        <View style={styles.row}>
          <View style={styles.brandCol}>
            <Text style={styles.brand}>ShubhMilan</Text>
            <Text style={styles.tagline}>
              Trusted matrimony — verified profiles, AI-powered matches, kundli compatibility you can
              trust. Free for everyone.
            </Text>
          </View>
          {COL_LINKS.map((col) => (
            <View key={col.heading} style={styles.linkCol}>
              <Text style={styles.heading}>{col.heading}</Text>
              {col.links.map((link) => (
                <Link key={link.href} href={link.href as never} asChild>
                  <Pressable hitSlop={4}>
                    <Text style={styles.link}>{link.label}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.legal}>
          <Text style={styles.legalText}>© {new Date().getFullYear()} ShubhMilan. All rights reserved.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginTop: spacing.xxxl,
  },
  frame: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxl,
    marginBottom: spacing.xl,
  },
  brandCol: { flexBasis: 320, flexGrow: 1, gap: spacing.sm },
  brand: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, letterSpacing: 0.2 },
  tagline: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.6, maxWidth: 360 },
  linkCol: { flexBasis: 160, flexGrow: 0, gap: 8 },
  heading: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  link: { color: colors.textMuted, fontSize: fontSizes.sm, paddingVertical: 4 },
  legal: { borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: spacing.lg },
  legalText: { color: colors.textSubtle, fontSize: fontSizes.xs },
});
