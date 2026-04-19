import { Button, Card, TrustDonut, VerificationBadge, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function VerifyPromo() {
  const router = useRouter();
  const status = useQuery({ queryKey: ['verification'], queryFn: () => api.verification.get() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Text style={styles.step}>Step 6 of 6</Text>
        <Text style={styles.title}>Build trust, unlock premium matches</Text>
        <Text style={styles.sub}>
          Verified profiles get 3× more responses. Complete any of the six steps below.
        </Text>

        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <TrustDonut score={status.data?.trustScore ?? 0} size={80} />
            <View style={{ flex: 1 }}>
              <VerificationBadge tier={status.data?.tier ?? 'BASIC'} />
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                Basic (0–40) · Verified (41–80) · Premium Trust (81–100)
              </Text>
            </View>
          </View>
        </Card>

        <Button title="Verify now" onPress={() => router.push('/verify')} block />
        <Button
          title="Skip and finish"
          variant="ghost"
          onPress={() => router.replace('/(tabs)/home')}
          block
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  step: { color: colors.primary, fontWeight: '700', letterSpacing: 1, fontSize: fontSizes.xs + 1, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4 },
  sub: { color: colors.textMuted, marginBottom: spacing.lg },
});
