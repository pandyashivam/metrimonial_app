import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { SignupInput } from '@shubhmilan/validation';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    const parsed = SignupInput.safeParse({ email, phone, password });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? 'Check your inputs');
      return;
    }
    setLoading(true);
    try {
      await api.auth.signup(parsed.data);
      router.push({ pathname: '/(auth)/otp', params: { target: phone, purpose: 'SIGNUP' } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Create your free profile</Text>
          <Text style={styles.sub}>We&apos;ll send an OTP to verify your phone.</Text>
          <View style={{ marginTop: spacing.lg }}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+91…"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 chars, mixed case + digit"
            />
            {err ? <Text style={styles.err}>{err}</Text> : null}
            <Button title="Continue" onPress={submit} loading={loading} block />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  sub: { fontSize: fontSizes.md, color: colors.textMuted, marginTop: 6 },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
