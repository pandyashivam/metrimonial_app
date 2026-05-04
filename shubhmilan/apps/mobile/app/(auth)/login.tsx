import {
  Button,
  Input,
  PasswordInput,
  colors,
  fonts,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useAuth } from '../../src/auth-store';
import { KeyboardSafe } from '../../src/KeyboardSafe';

interface FormValues {
  identifier: string;
  password: string;
}

/**
 * Login — sign-in screen.
 *
 * `mode='onBlur'` so we don't badger the user mid-typing. Server errors render
 * in a single banner above the submit; field-level errors render under each
 * field. Password reveal eye lives inside the input.
 */
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
      setServerErr(e instanceof Error ? e.message : "We couldn't sign you in. Try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <View style={styles.frame}>
            <Text style={styles.kicker}>Welcome back</Text>
            <Text style={styles.title}>Sign in to ShubhMilan</Text>
            <Text style={styles.sub}>Continue your search where you left off.</Text>

            {serverErr ? (
              <View style={styles.banner} accessibilityLiveRegion="polite">
                <Text style={styles.bannerText}>{serverErr}</Text>
              </View>
            ) : null}

            <View style={styles.fields}>
              <Controller
                control={control}
                name="identifier"
                rules={{ required: 'Enter your email or phone' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email or phone"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoComplete="username"
                    inputMode="email"
                    placeholder="you@example.com"
                    error={errors.identifier?.message}
                    returnKeyType="next"
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                rules={{ required: 'Enter your password' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="current-password"
                    placeholder="Your password"
                    error={errors.password?.message}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              <Pressable
                onPress={() => router.push('/(auth)/welcome')}
                hitSlop={6}
                style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            <Button
              title="Sign in"
              size="lg"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              block
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to ShubhMilan?</Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable hitSlop={6}>
                  <Text style={styles.footerLink}>Create a free profile</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardSafe>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  frame: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
    color: colors.ink,
    fontWeight: '700',
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * 1.15,
    marginTop: spacing.xs,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  banner: {
    backgroundColor: colors.danger50,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: colors.danger, fontSize: fontSizes.sm, fontWeight: '500' },
  fields: { marginBottom: spacing.md },
  forgot: { alignSelf: 'flex-end', paddingVertical: spacing.xs, marginTop: -spacing.xs },
  forgotText: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted, fontSize: fontSizes.sm },
  footerLink: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700' },
});
