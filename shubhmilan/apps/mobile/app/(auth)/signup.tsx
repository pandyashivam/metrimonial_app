import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { SignupInput } from '@shubhmilan/validation';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';

/**
 * Signup form — React Hook Form + our shared Zod schema. The form owns its own field
 * state + validation; we only touch server-side errors at submit time.
 */

interface FormValues {
  email: string;
  phone: string;
  password: string;
}

export default function Signup() {
  const router = useRouter();
  const [serverErr, setServerErr] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', phone: '+91', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: FormValues) => {
    setServerErr(null);
    // Run the shared Zod schema manually so the error surfaces consistently with the server.
    const parsed = SignupInput.safeParse(values);
    if (!parsed.success) {
      setServerErr(parsed.error.issues[0]?.message ?? 'Check your inputs');
      return;
    }
    try {
      await api.auth.signup(parsed.data);
      router.push({
        pathname: '/(auth)/otp',
        params: { target: values.phone, purpose: 'SIGNUP' },
      });
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Signup failed');
    }
  };

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
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone is required',
                pattern: { value: /^\+?[1-9]\d{9,14}$/, message: 'Invalid phone' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+91…"
                  error={errors.phone?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                validate: (v) =>
                  (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) ||
                  'Mix case + include a digit',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  placeholder="At least 8 chars, mixed case + digit"
                  error={errors.password?.message}
                />
              )}
            />
            {serverErr ? <Text style={styles.err}>{serverErr}</Text> : null}
            <Button
              title="Continue"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              block
            />
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
