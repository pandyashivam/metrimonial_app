import { Button, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Trusted matrimony</Text>
        <Text style={styles.title}>Find the one, the right way</Text>
        <Text style={styles.sub}>
          Verified profiles. AI-powered matches. Kundli compatibility. Free for everyone.
        </Text>
      </View>
      <View style={{ gap: spacing.md, padding: spacing.lg }}>
        <Button title="Create a free profile" onPress={() => router.push('/(auth)/signup')} block />
        <Button title="I already have an account" variant="outline" onPress={() => router.push('/(auth)/login')} block />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  hero: { padding: spacing.xxl, gap: spacing.md },
  kicker: { color: colors.accentDark, fontWeight: '700', letterSpacing: 1.2, fontSize: fontSizes.xs + 1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontWeight: '800', fontSize: 34, lineHeight: 40 },
  sub: { color: colors.textMuted, fontSize: fontSizes.md },
});
