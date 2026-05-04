import { Button, colors, fonts, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Welcome — entry screen for unauthenticated users.
 *
 * Editorial hero (kicker + serif headline + supporting copy) over a quiet cream
 * background. Two CTAs: primary creates a profile, ghost link signs in. Content
 * is centered in a 480px column so the same layout reads well on phone, tablet,
 * and desktop web.
 */
export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        <View style={styles.hero}>
          <View style={styles.brand}>
            <View style={styles.brandDot} />
            <Text style={styles.brandWord}>ShubhMilan</Text>
          </View>
          <Text style={styles.kicker}>Trusted matrimony</Text>
          <Text style={styles.title}>Find the one,{'\n'}the right way.</Text>
          <Text style={styles.sub}>
            Verified profiles. Considered matches. Kundli compatibility you can trust. Built for
            families, free forever.
          </Text>
          <View style={styles.proofRow}>
            <Proof label="Verified" value="ID + Selfie" />
            <View style={styles.proofDivider} />
            <Proof label="Privacy" value="You control" />
            <View style={styles.proofDivider} />
            <Proof label="Match" value="Ashtakoot" />
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            title="Create your free profile"
            size="lg"
            onPress={() => router.push('/(auth)/signup')}
            block
          />
          <Button
            title="I already have an account"
            variant="ghost"
            size="lg"
            onPress={() => router.push('/(auth)/login')}
            block
          />
        </View>
        <Text style={styles.legal}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Proof({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.proofItem}>
      <Text style={styles.proofLabel}>{label}</Text>
      <Text style={styles.proofValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.xxxl },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  brandWord: {
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, serif` : fonts.display,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  hero: { gap: spacing.md },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
    color: colors.ink,
    fontWeight: '700',
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * 1.1,
    marginTop: spacing.xs,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    marginTop: spacing.sm,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  proofItem: { flex: 1, gap: 4 },
  proofLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  proofValue: { fontSize: fontSizes.sm, color: colors.ink, fontWeight: '600' },
  proofDivider: { width: 1, backgroundColor: colors.border },
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  legal: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: fontSizes.xs * 1.5,
  },
});
