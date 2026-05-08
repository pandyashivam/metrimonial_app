import {
  Banner,
  Button,
  Card,
  Input,
  PageFrame,
  ScreenHeader,
  TrustDonut,
  VerificationBadge,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../../src/api';

type Step = {
  key: 'email' | 'phone' | 'aadhaar' | 'selfie' | 'video' | 'background';
  label: string;
  description: string;
  done: boolean;
};

export default function Verify() {
  const router = useRouter();
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ['verification'], queryFn: () => api.verification.get() });
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [notice, setNotice] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);

  const mut = {
    reqEmail: useMutation({
      mutationFn: () => api.verification.requestEmail(),
      onSuccess: () => setNotice({ kind: 'info', text: 'Code sent to your email.' }),
      onError: () => setNotice({ kind: 'error', text: "We couldn't send the email. Try again." }),
    }),
    verEmail: useMutation({
      mutationFn: (c: string) => api.verification.verifyEmail(c),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['verification'] });
        setNotice({ kind: 'success', text: 'Email verified.' });
      },
      onError: () => setNotice({ kind: 'error', text: 'Wrong or expired code. Try again.' }),
    }),
    reqPhone: useMutation({
      mutationFn: () => api.verification.requestPhone(),
      onSuccess: () => setNotice({ kind: 'info', text: 'OTP sent to your phone.' }),
      onError: () => setNotice({ kind: 'error', text: "We couldn't send the OTP. Try again." }),
    }),
    verPhone: useMutation({
      mutationFn: (c: string) => api.verification.verifyPhone(c),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['verification'] });
        setNotice({ kind: 'success', text: 'Phone verified.' });
      },
      onError: () => setNotice({ kind: 'error', text: 'Wrong or expired OTP. Try again.' }),
    }),
    selfie: useMutation({
      mutationFn: () => api.verification.submitSelfie(),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['verification'] }),
    }),
    background: useMutation({
      mutationFn: () => api.verification.requestBackground(),
      onSuccess: () =>
        setNotice({ kind: 'success', text: 'Background check requested. We will email you with next steps.' }),
    }),
  };

  const s = status.data;
  const steps: Step[] = [
    { key: 'email', label: '1. Email', description: 'Verify your email with a one-time code.', done: !!s?.emailVerified },
    { key: 'phone', label: '2. Phone', description: 'Verify your phone number with an SMS OTP.', done: !!s?.phoneVerified },
    { key: 'aadhaar', label: '3. Aadhaar', description: 'Verify via DigiLocker / HyperVerge. +25 trust.', done: !!s?.aadhaarVerified },
    { key: 'selfie', label: '4. Selfie match', description: 'Capture a selfie; we match it against your primary photo.', done: !!s?.selfieVerified },
    { key: 'video', label: '5. Video KYC', description: 'Record a short prompt — reviewed by our team.', done: !!s?.videoKycVerified },
    { key: 'background', label: '6. Background check', description: 'Optional paid tier — see Premium plan.', done: !!s?.backgroundVerified },
  ];

  return (
    <PageFrame>
      <ScreenHeader
        kicker="Trust"
        title="Verify your profile"
        subtitle="Each step adds to your trust score. Verified profiles get up to 3× more responses."
      />

      {notice ? (
        <Banner variant={notice.kind === 'error' ? 'error' : notice.kind === 'success' ? 'success' : 'info'}>
          {notice.text}
        </Banner>
      ) : null}

      {s?.lastRejectionStep && s?.lastRejectionReason ? (
        <Banner
          variant="warn"
          title={`Your ${s.lastRejectionStep} step needs another look`}
        >
          Reviewer feedback: "{s.lastRejectionReason}". Resubmit when you've addressed it.
        </Banner>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.summary}>
          <TrustDonut score={s?.trustScore ?? 0} size={84} />
          <View style={{ flex: 1, gap: 6 }}>
            <VerificationBadge tier={s?.tier ?? 'BASIC'} />
            <Text style={styles.hint}>
              Each step increases your trust score and unlocks higher tiers.
            </Text>
          </View>
        </View>
      </Card>

      {steps.map((step) => (
        <Card key={step.key} style={styles.card}>
          <Text style={styles.stepLabel}>{step.label}</Text>
          <Text style={styles.stepDesc}>{step.description}</Text>
          {step.done ? (
            <Text style={styles.done}>✓ Verified</Text>
          ) : step.key === 'email' ? (
            <View style={{ gap: spacing.sm }}>
              <Button title="Send code" variant="outline" onPress={() => mut.reqEmail.mutate()} loading={mut.reqEmail.isPending} />
              <Input
                value={emailCode}
                onChangeText={setEmailCode}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                title="Verify email"
                onPress={() => mut.verEmail.mutate(emailCode)}
                loading={mut.verEmail.isPending}
                disabled={emailCode.length !== 6}
              />
            </View>
          ) : step.key === 'phone' ? (
            <View style={{ gap: spacing.sm }}>
              <Button title="Send OTP" variant="outline" onPress={() => mut.reqPhone.mutate()} loading={mut.reqPhone.isPending} />
              <Input
                value={phoneCode}
                onChangeText={setPhoneCode}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                title="Verify phone"
                onPress={() => mut.verPhone.mutate(phoneCode)}
                loading={mut.verPhone.isPending}
                disabled={phoneCode.length !== 6}
              />
            </View>
          ) : step.key === 'selfie' ? (
            <Button title="Submit selfie" onPress={() => mut.selfie.mutate()} loading={mut.selfie.isPending} />
          ) : step.key === 'video' ? (
            <Button title="Record video KYC" onPress={() => router.push('/verify/video')} />
          ) : step.key === 'background' ? (
            <Button
              title="Request background check"
              onPress={() => mut.background.mutate()}
              loading={mut.background.isPending}
            />
          ) : (
            <Button
              title="Verify with Aadhaar"
              onPress={() =>
                setNotice({
                  kind: 'info',
                  text: 'The Aadhaar flow opens in our verified provider. We will guide you through it from your phone.',
                })
              }
            />
          )}
        </Card>
      ))}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  summary: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  hint: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
  stepLabel: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  stepDesc: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    lineHeight: fontSizes.sm * 1.5,
  },
  done: { color: colors.success, fontWeight: '700', fontSize: fontSizes.sm },
});
