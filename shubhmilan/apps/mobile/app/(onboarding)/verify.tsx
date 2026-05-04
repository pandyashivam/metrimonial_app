import {
  Button,
  Card,
  PageFrame,
  ScreenHeader,
  TrustDonut,
  VerificationBadge,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../../src/api';

export default function VerifyPromo() {
  const router = useRouter();
  const status = useQuery({ queryKey: ['verification'], queryFn: () => api.verification.get() });

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Step 6 of 6"
        title="Build trust, unlock premium matches"
        subtitle="Verified profiles get 3× more responses. Pick any step below — you can finish the rest later."
      />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.summary}>
          <TrustDonut score={status.data?.trustScore ?? 0} size={84} />
          <View style={{ flex: 1, gap: 6 }}>
            <VerificationBadge tier={status.data?.tier ?? 'BASIC'} />
            <Text style={styles.tierBands}>
              Basic 0–40  ·  Verified 41–80  ·  Premium Trust 81–100
            </Text>
          </View>
        </View>
      </Card>
      <Button title="Verify now" size="lg" onPress={() => router.push('/verify')} block />
      <Button
        title="Skip and finish"
        variant="ghost"
        size="lg"
        onPress={() => router.replace('/(tabs)/home')}
        block
        style={{ marginTop: spacing.sm }}
      />
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  tierBands: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    letterSpacing: 0.3,
  },
});
