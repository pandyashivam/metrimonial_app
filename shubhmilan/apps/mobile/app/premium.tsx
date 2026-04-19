import { Button, Card, Chip, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../src/api';

export default function Premium() {
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.payments.plans() });
  const sub = useQuery({ queryKey: ['my-subscription'], queryFn: () => api.payments.mySubscription() });

  const order = useMutation({
    mutationFn: (planId: string) => api.payments.createOrder(planId),
    onSuccess: (o) => {
      // In the real app: launch RazorpayCheckout.open(o). Here we surface the order id.
      Alert.alert('Order created', `Order ${o.orderId} for ₹${o.amount / 100}`);
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.h1}>Go Premium</Text>
        <Text style={styles.sub}>
          You never have to pay — but Premium unlocks power features if you want them.
        </Text>

        {sub.data && (
          <Card>
            <Chip label="Active" tone="success" />
            <Text style={styles.activeName}>{(sub.data as unknown as { plan?: { name: string } }).plan?.name ?? 'Premium'}</Text>
            <Text style={styles.sub}>
              Renews on{' '}
              {new Date((sub.data as unknown as { endsAt: string }).endsAt).toLocaleDateString()}
            </Text>
          </Card>
        )}

        {(plans.data ?? []).map((p) => (
          <Card key={p.id}>
            <Text style={styles.planName}>{p.name}</Text>
            <Text style={styles.price}>
              {p.priceInr === 0 ? 'Free' : `₹${Math.round(p.priceInr / 100)}`}{' '}
              <Text style={styles.priceMeta}>/ {p.durationDays} days</Text>
            </Text>
            <View style={{ marginVertical: 8 }}>
              {(p.features as unknown as string[]).map((f) => (
                <Text key={f} style={styles.feature}>· {f}</Text>
              ))}
            </View>
            {p.priceInr > 0 && (
              <Button
                title={order.isPending ? 'Creating order…' : 'Buy plan'}
                onPress={() => order.mutate(p.id)}
                loading={order.isPending}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.textMuted, marginTop: 4 },
  planName: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.ink },
  price: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 4 },
  priceMeta: { fontSize: fontSizes.xs + 1, color: colors.textMuted, fontWeight: '500' },
  feature: { color: colors.text, paddingVertical: 2 },
  activeName: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.ink, marginTop: 4 },
});
