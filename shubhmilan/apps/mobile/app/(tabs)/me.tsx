import { Button, Card, TrustDonut, VerificationBadge, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';

export default function Me() {
  const { user, signOut } = useAuth();
  const completeness = useQuery({
    queryKey: ['completeness'],
    queryFn: () => api.me.completeness(),
  });
  const verification = useQuery({
    queryKey: ['verification'],
    queryFn: () => api.me.verification(),
  });

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
            <TrustDonut score={verification.data?.trustScore ?? 0} size={76} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Trust & verification</Text>
              <VerificationBadge tier={verification.data?.tier ?? 'BASIC'} />
              <Text style={styles.sub}>
                Complete email, phone, Aadhaar, selfie & video KYC to reach Premium.
              </Text>
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
