import { Button, colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
import { Link, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

/**
 * Sticky marketing-page header used by every (public) route on the web build.
 * Logo on the left, nav links (only on wider viewports), Sign in + Get started
 * CTAs on the right. The header is web-only — native consumers never enter
 * the (public) group, so the layout never renders the header on phone/tablet
 * native shells.
 */

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/success-stories', label: 'Stories' },
  { href: '/safety', label: 'Safety' },
  { href: '/about', label: 'About' },
];

export function MarketingHeader() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const wide = width >= 768;

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Link href="/" asChild>
          <Pressable hitSlop={6} style={styles.brand}>
            <View style={styles.brandDot} />
            <Text style={styles.brandWord}>ShubhMilan</Text>
          </Pressable>
        </Link>

        {wide ? (
          <View style={styles.nav}>
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href as never} asChild>
                  <Pressable hitSlop={4} style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.navLink, hovered ? styles.navLinkHover : null]}>
                    <Text style={[styles.navLinkText, active ? styles.navLinkActive : null]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={4}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/signup" asChild>
            <Button title="Get started" size="sm" />
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    ...(Platform.OS === 'web'
      ? ({ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'saturate(140%) blur(8px)' } as never)
      : {}),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.primary },
  brandWord: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
    letterSpacing: 0.2,
  },
  nav: { flexDirection: 'row', gap: 4, flex: 1, justifyContent: 'center' },
  navLink: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  navLinkHover: { backgroundColor: colors.surfaceAlt },
  navLinkText: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '500' },
  navLinkActive: { color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  signInLink: { color: colors.ink, fontSize: fontSizes.sm, fontWeight: '600' },
});
