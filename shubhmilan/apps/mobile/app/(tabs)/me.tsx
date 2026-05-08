import {
  Button,
  Card,
  Chip,
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
  // Used by the "View as others see" CTA so we can deep-link to the public
  // profile detail screen with the user's own profile id.
  const myProfile = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.me.profile(),
  });

  const tier = entitlements.data?.tier ?? 'FREE';
  const remaining = entitlements.data?.interestsRemainingThisMonth ?? -1;
  const percent = completeness.data?.percent ?? 0;

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Your account"
        title={user?.email?.split('@')[0] ?? 'Profile'}
        subtitle={[user?.email, user?.phone].filter(Boolean).join(' · ')}
        size="md"
      />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>Plan</Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Chip
                label={tier === 'FREE' ? 'Free forever' : tier}
                tone={tier === 'FREE' ? 'neutral' : 'accent'}
              />
            </View>
            <Text style={styles.sub}>
              {tier === 'FREE'
                ? `${remaining === -1 ? 'Unlimited' : remaining} interests remaining this month`
                : 'Unlimited interests, who-viewed-me, advanced filters'}
            </Text>
          </View>
          <Button
            title={tier === 'FREE' ? 'Upgrade' : 'Manage'}
            variant={tier === 'FREE' ? 'primary' : 'outline'}
            size="md"
            onPress={() => router.push('/premium')}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <TrustDonut score={verification.data?.trustScore ?? 0} size={76} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.h2}>Trust & verification</Text>
            <View style={{ flexDirection: 'row' }}>
              <VerificationBadge tier={verification.data?.tier ?? 'BASIC'} />
            </View>
            <Text style={styles.sub}>
              Complete email, phone, Aadhaar, selfie and video KYC to reach Premium Trust.
            </Text>
            <Button
              title="Verify now"
              variant="outline"
              size="md"
              onPress={() => router.push('/verify')}
              style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>Profile completeness</Text>
        <Text style={styles.bigNumber}>
          {percent}<Text style={styles.bigPct}>%</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, percent)}%` }]} />
        </View>
        {completeness.data?.missing?.length ? (
          <Text style={styles.sub}>Missing: {completeness.data.missing.join(', ')}</Text>
        ) : (
          <Text style={styles.sub}>All sections complete.</Text>
        )}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
          <Button
            title="View as others see"
            variant="outline"
            size="md"
            disabled={!myProfile.data?.id}
            onPress={() => myProfile.data?.id && router.push(`/profile/${myProfile.data.id}`)}
          />
          <Button
            title="Edit profile"
            variant="ghost"
            size="md"
            onPress={() => router.push('/(onboarding)/basics')}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.h2}>More</Text>
        <Button
          title="Settings"
          variant="outline"
          size="md"
          onPress={() => router.push('/settings')}
          block
          style={{ marginBottom: spacing.sm }}
        />
        <Button title="Sign out" variant="ghost" size="md" onPress={signOut} block />
      </Card>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  h2: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: 4,
    lineHeight: fontSizes.sm * 1.5,
  },
  bigNumber: {
    fontSize: fontSizes.display,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 4,
    lineHeight: fontSizes.display * 1.05,
  },
  bigPct: { fontSize: fontSizes.xl, color: colors.textMuted, fontWeight: '500' },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
});
