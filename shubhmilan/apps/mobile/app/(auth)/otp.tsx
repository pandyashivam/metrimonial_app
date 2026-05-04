import { Button, Input, colors, spacing } from '@shubhmilan/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, tokenProvider } from '../../src/api';
import { useAuth } from '../../src/auth-store';
import { KeyboardSafe } from '../../src/KeyboardSafe';

type Purpose = 'SIGNUP' | 'LOGIN' | 'RESET' | 'VERIFY_EMAIL' | 'VERIFY_PHONE';

export default function Otp() {
  const { target, purpose } = useLocalSearchParams<{ target: string; purpose: Purpose }>();
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function verify() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp({
        target: target!,
        code,
        purpose: (purpose ?? 'SIGNUP') as Purpose,
      });
      tokenProvider.setTokens(res.tokens);
      setUser(res.user);
      router.replace('/(tabs)/home');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await api.auth.resendOtp({ target: target!, purpose: (purpose ?? 'SIGNUP') as Purpose });
    } catch {
      /* ignore */
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.sub}>We sent a 6-digit code to {target}</Text>
          <Input
            label="OTP"
            value={code}
            onChangeText={setCode}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
          />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Button title="Verify & continue" onPress={verify} loading={loading} block />
          <Button title="Resend OTP" variant="ghost" onPress={resend} block style={{ marginTop: spacing.sm }} />
        </ScrollView>
      </KeyboardSafe>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  sub: { color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
