import { Button, Card, Chip, TrustDonut, VerificationBadge, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';

export default function Me() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const completeness = useQuery({
    queryKey: ['completeness'],
    queryFn: () => api.me.completeness(),
  });
  const verification = useQuery({
    queryKey: ['verification'],
    queryFn: () => api.me.verification(),
  });
  const entitlements = useQuery({
    queryKey: ['entitlements'],
    queryFn: () => api.interests.entitlements(),
  });

  const tier = entitlements.data?.tier ?? 'FREE';
  const remaining = entitlements.data?.interestsRemainingThisMonth ?? -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={styles.h1}>Your account</Text>
          <Text style={styles.sub}>{user?.email}</Text>
          <Text style={styles.sub}>{user?.phone}</Text>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Plan</Text>
              <Chip
                label={tier === 'FREE' ? 'Free forever' : tier}
                tone={tier === 'FREE' ? 'neutral' : 'accent'}
              />
              <Text style={styles.sub}>
                {tier === 'FREE'
                  ? `${remaining === -1 ? 'Unlimited' : remaining} interests remaining this month`
                  : 'Unlimited interests, who-viewed-me, advanced filters'}
              </Text>
            </View>
            <Button
              title={tier === 'FREE' ? 'Upgrade' : 'Manage'}
              size="sm"
              onPress={() => router.push('/premium')}
            />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <TrustDonut score={verification.data?.trustScore ?? 0} size={76} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Trust & verification</Text>
              <VerificationBadge tier={verification.data?.tier ?? 'BASIC'} />
              <Text style={styles.sub}>
                Complete email, phone, Aadhaar, selfie & video KYC to reach Premium.
              </Text>
              <Button
                title="Verify now"
                variant="outline"
                size="sm"
                onPress={() => router.push('/verify')}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.h2}>Profile completeness</Text>
          <Text style={styles.big}>{completeness.data?.percent ?? 0}%</Text>
          {completeness.data?.missing?.length ? (
            <Text style={styles.sub}>
              Missing: {completeness.data.missing.join(', ')}
            </Text>
          ) : (
            <Text style={styles.sub}>All sections complete 🎉</Text>
          )}
        </Card>

        <Button title="Sign out" variant="outline" onPress={signOut} block />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  h2: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  sub: { color: colors.textMuted, marginTop: 4 },
  big: { fontSize: 40, fontWeight: '800', color: colors.primary, marginVertical: 8 },
});
