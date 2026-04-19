import { Button, Card, TrustDonut, VerificationBadge, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

type Step = {
  key: 'email' | 'phone' | 'aadhaar' | 'selfie' | 'video' | 'background';
  label: string;
  description: string;
  done: boolean;
};

export default function Verify() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ['verification'], queryFn: () => api.verification.get() });
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  const mut = {
    reqEmail: useMutation({ mutationFn: () => api.verification.requestEmail() }),
    verEmail: useMutation({
      mutationFn: (c: string) => api.verification.verifyEmail(c),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['verification'] }),
    }),
    reqPhone: useMutation({ mutationFn: () => api.verification.requestPhone() }),
    verPhone: useMutation({
      mutationFn: (c: string) => api.verification.verifyPhone(c),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['verification'] }),
    }),
    selfie: useMutation({
      mutationFn: () => api.verification.submitSelfie(),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['verification'] }),
    }),
    video: useMutation({
      mutationFn: () => api.verification.submitVideo(),
      onSuccess: () => Alert.alert('Submitted', 'Our team will review your video KYC within 24 hours.'),
    }),
    background: useMutation({
      mutationFn: () => api.verification.requestBackground(),
      onSuccess: () => Alert.alert('Requested', 'We will reach out with next steps shortly.'),
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <TrustDonut score={s?.trustScore ?? 0} size={84} />
            <View style={{ flex: 1 }}>
              <VerificationBadge tier={s?.tier ?? 'BASIC'} />
              <Text style={styles.hint}>Each step increases your trust score and unlocks higher tiers.</Text>
            </View>
          </View>
        </Card>

        {steps.map((step) => (
          <Card key={step.key}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
            {step.done ? (
              <Text style={styles.done}>✓ Verified</Text>
            ) : step.key === 'email' ? (
              <View style={{ gap: spacing.sm }}>
                <Button title="Send code" variant="outline" onPress={() => mut.reqEmail.mutate()} />
                <TextInput
                  value={emailCode}
                  onChangeText={setEmailCode}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  style={styles.input}
                />
                <Button
                  title="Verify email"
                  onPress={() => mut.verEmail.mutate(emailCode)}
                  loading={mut.verEmail.isPending}
                />
              </View>
            ) : step.key === 'phone' ? (
              <View style={{ gap: spacing.sm }}>
                <Button title="Send code" variant="outline" onPress={() => mut.reqPhone.mutate()} />
                <TextInput
                  value={phoneCode}
                  onChangeText={setPhoneCode}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  style={styles.input}
                />
                <Button
                  title="Verify phone"
                  onPress={() => mut.verPhone.mutate(phoneCode)}
                  loading={mut.verPhone.isPending}
                />
              </View>
            ) : step.key === 'selfie' ? (
              <Button title="Submit selfie" onPress={() => mut.selfie.mutate()} loading={mut.selfie.isPending} />
            ) : step.key === 'video' ? (
              <Button title="Start video KYC" onPress={() => mut.video.mutate()} />
            ) : step.key === 'background' ? (
              <Button title="Request background check" onPress={() => mut.background.mutate()} />
            ) : (
              <Button
                title="Start Aadhaar flow"
                onPress={() =>
                  Alert.alert('KYC', 'Integrate Digio / HyperVerge here, then POST last-4 + providerRef.')
                }
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, marginTop: 4 },
  stepLabel: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  stepDesc: { color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  done: { color: colors.success, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#d8d8df',
    borderRadius: 8,
    padding: 11,
    backgroundColor: '#fff',
    fontSize: fontSizes.sm + 1,
  },
});
