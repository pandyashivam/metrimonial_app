import { Button, Input, colors, spacing } from '@shubhmilan/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';

interface FormValues {
  identifier: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { identifier: '', password: '' }, mode: 'onBlur' });

  const onSubmit = async (values: FormValues) => {
    setServerErr(null);
    try {
      const res = await api.auth.login(values);
      setUser(res.user);
      router.replace('/(tabs)/home');
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Welcome back</Text>
          <Controller
            control={control}
            name="identifier"
            rules={{ required: 'Email or phone is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email or phone"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                error={errors.identifier?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />
          {serverErr ? <Text style={styles.err}>{serverErr}</Text> : null}
          <Button title="Log in" onPress={handleSubmit(onSubmit)} loading={isSubmitting} block />
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
