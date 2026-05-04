import {
  Banner,
  Button,
  Card,
  Chip,
  PageFrame,
  ScreenHeader,
  Skeleton,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../src/api';

export default function Premium() {
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.payments.plans() });
  const sub = useQuery({ queryKey: ['my-subscription'], queryFn: () => api.payments.mySubscription() });
  const [orderInfo, setOrderInfo] = useState<{ id: string; amount: number } | null>(null);

  const order = useMutation({
    mutationFn: (planId: string) => api.payments.createOrder(planId),
    onSuccess: (o) => {
      // Real device flow opens RazorpayCheckout. Until that lands we surface the
      // order id inside the page so the action remains visible after navigation.
      setOrderInfo({ id: o.orderId, amount: o.amount });
    },
  });

  const activeSub = sub.data as unknown as { plan?: { name: string }; endsAt?: string } | undefined;

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Optional upgrade"
        title="Go Premium"
        subtitle="You never have to pay. Premium unlocks power features when you want them."
      />

      {orderInfo ? (
        <Banner variant="success" title={`Order #${orderInfo.id}`}>
          ₹{orderInfo.amount / 100} ready for payment. The Razorpay checkout will open on your
          device when you proceed.
        </Banner>
      ) : null}

      {activeSub && (
        <Card style={styles.card}>
          <Chip label="Active" tone="success" />
          <Text style={styles.activeName}>{activeSub.plan?.name ?? 'Premium'}</Text>
          {activeSub.endsAt ? (
            <Text style={styles.sub}>
              Renews on {new Date(activeSub.endsAt).toLocaleDateString()}
            </Text>
          ) : null}
        </Card>
      )}

      {plans.isLoading ? (
        <View style={{ gap: spacing.md }}>
          <SkeletonPlanCard />
          <SkeletonPlanCard />
        </View>
      ) : (
        (plans.data ?? []).map((p) => (
          <Card key={p.id} style={styles.card}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{p.name}</Text>
              {p.priceInr === 0 ? <Chip label="Free forever" tone="success" /> : null}
            </View>
            <Text style={styles.price}>
              {p.priceInr === 0 ? 'Free' : `₹${Math.round(p.priceInr / 100)}`}{' '}
              <Text style={styles.priceMeta}>/ {p.durationDays} days</Text>
            </Text>
            <View style={styles.features}>
              {(p.features as unknown as string[]).map((f) => (
                <Text key={f} style={styles.feature}>· {f}</Text>
              ))}
            </View>
            {p.priceInr > 0 && (
              <Button
                title={order.isPending ? 'Creating order…' : `Buy ${p.name}`}
                size="lg"
                onPress={() => order.mutate(p.id)}
                loading={order.isPending}
                block
              />
            )}
          </Card>
        ))
      )}
    </PageFrame>
  );
}

function SkeletonPlanCard() {
  return (
    <Card>
      <Skeleton height={22} width="40%" />
      <Skeleton height={36} width="55%" style={{ marginTop: 12 }} />
      <Skeleton height={14} style={{ marginTop: 16 }} />
      <Skeleton height={14} width="80%" style={{ marginTop: 8 }} />
      <Skeleton height={14} width="65%" style={{ marginTop: 8 }} />
      <Skeleton height={48} rounded={14} style={{ marginTop: 18 }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.ink },
  price: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.primary, marginTop: 6 },
  priceMeta: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: '500' },
  features: { marginVertical: spacing.md, gap: 4 },
  feature: { color: colors.text, fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.5 },
  activeName: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.ink, marginTop: 8 },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: fontSizes.sm },
});
