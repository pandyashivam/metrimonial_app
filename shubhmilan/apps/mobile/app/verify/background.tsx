import { Button, Card, Chip, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';

/**
 * Background-check purchase screen. Gold/Platinum members get it included; others pay a
 * one-time ₹1500 fee via Razorpay. We call the server to create an order, then hand off
 * to Razorpay's hosted checkout via a deep link — this keeps the native Razorpay SDK
 * out of the Expo build (it requires custom Android config the mobile scaffold doesn't
 * carry yet).
 */
export default function BackgroundCheck() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subscription = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.payments.mySubscription(),
  });

  const startFlow = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await api.raw.request<{
        queued: boolean;
        free: boolean;
        orderId?: string;
        amount?: number;
        keyId?: string;
        receipt?: string;
      }>('/me/verification/background/order', { method: 'POST' });

      if (res.queued && res.free) {
        haptics.success();
        router.replace('/verify');
        return;
      }
      if (res.orderId && res.keyId) {
        // Razorpay hosted checkout URL.
        const url = `https://checkout.razorpay.com/v1/checkout.js?key_id=${res.keyId}&order_id=${res.orderId}`;
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
        else setErr('Could not open Razorpay checkout');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not start payment');
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  const isGoldOrAbove = (() => {
    const name = (subscription.data as unknown as { plan?: { name: string } } | null)?.plan?.name?.toLowerCase();
    return name?.includes('gold') || name?.includes('platinum');
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={styles.h1}>Background check</Text>
          <Text style={styles.sub}>
            An independent verification of employment, address and criminal record. Increases
            your trust score significantly and adds a premium trust badge to your profile.
          </Text>
          <View style={styles.row}>
            <Chip label="₹1,500 one-time" tone="accent" />
            <Chip label="5–7 business days" tone="info" />
            <Chip label="Voluntary" tone="neutral" />
          </View>
        </Card>

        {isGoldOrAbove ? (
          <Card>
            <Text style={styles.h2}>Included with your plan ✨</Text>
            <Text style={styles.sub}>
              Gold and Platinum members get a free background check. Tap below to queue yours
              — a verifier will reach out for supporting documents within 24 hours.
            </Text>
            <Button
              title="Request free check"
              onPress={startFlow}
              loading={submitting}
              block
            />
          </Card>
        ) : (
          <Card>
            <Text style={styles.h2}>Start a background check</Text>
            <Text style={styles.sub}>
              ₹1,500 one-time. Payment is handled by Razorpay (Indian UPI, cards, netbanking).
              Your money is refunded in full if we can&apos;t verify your details.
            </Text>
            <Button title="Pay & start" onPress={startFlow} loading={submitting} block />
          </Card>
        )}

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Card>
          <Text style={styles.h2}>What we check</Text>
          <Text style={styles.bullet}>• Employment letter / income proof</Text>
          <Text style={styles.bullet}>• Address verification via utility bill</Text>
          <Text style={styles.bullet}>• Police clearance (via an accredited agency)</Text>
          <Text style={styles.bullet}>• Basic court-record screening</Text>
          <Text style={styles.sub}>All data is encrypted at rest and deleted after 12 months.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  h2: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  sub: { color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  bullet: { color: colors.text, marginBottom: 4 },
  err: { color: colors.danger, fontWeight: '600', padding: spacing.md },
});
