import { Button, Input, colors, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';

export default function Login() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api.auth.login({ identifier, password });
      setUser(res.user);
      router.replace('/(tabs)/home');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Welcome back</Text>
          <Input
            label="Email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Button title="Log in" onPress={submit} loading={loading} block />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
